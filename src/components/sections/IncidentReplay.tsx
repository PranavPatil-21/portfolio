'use client'

import { useEffect, useState } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'
import type { Replay } from '@/content'

/**
 * Where playback is. `idle` and `done` render identically — every step complete
 * — which is the whole trick that lets this animate without hiding anything.
 */
type Phase = 'idle' | 'running' | 'paused' | 'done'

/** How a single step reads right now. Also the `data-state` the tests assert. */
type StepState = 'pending' | 'active' | 'done'

/** Fallback pacing for a step whose `hold` the CMS left at zero. */
const DEFAULT_HOLD = 1200

/**
 * An interactive replay of a multi-agent investigation.
 *
 * ## The load-bearing decision: the resting state is the *finished* state
 *
 * The obvious way to build this is to start empty and append steps as timers
 * fire. That ships a section whose content only exists after a click — invisible
 * to a crawler, to a reader with JavaScript off, and to anyone reading the page
 * source. For a portfolio, where this section *is* the evidence, that is a
 * self-inflicted wound.
 *
 * So the component inverts it. The server renders the complete script — the
 * incident, every step with its finding and citation, the conclusion — fully
 * opaque, in an ordered list. The first client render is byte-identical, so
 * hydration is silent. Pressing "Run" is what *takes the story away*: playback
 * rewinds to step one and hands it back one step at a time. Nothing is ever
 * gated behind the animation; the animation is a way of re-reading something the
 * reader could already see.
 *
 * A consequence worth naming: the dimming of not-yet-revealed steps is applied
 * through `data-state` attributes that only ever leave `done` on the client,
 * after an interaction. The no-JavaScript rendering therefore has no transparent
 * nodes at all, which is exactly what the Playwright accessibility test asserts.
 *
 * ## Reduced motion
 *
 * Read at the moment of the click rather than through a hook. Because idle and
 * done are visually the same, there is nothing for a hook to correct after mount
 * — the only decision that depends on the preference is "does pressing Run start
 * timers or jump straight to the end", and that decision is made inside the
 * handler. No timer is ever scheduled for a reader who asked for stillness.
 *
 * ## Announcements
 *
 * The list is `aria-live="polite"` — this is a demo, not an emergency, and
 * `assertive` would interrupt whatever the reader is doing. Steps that have not
 * landed yet are `aria-hidden` during playback, so each reveal enters the
 * accessibility tree as new content and is announced once. There is deliberately
 * no mirrored visually-hidden copy of the findings: that would duplicate every
 * string in the DOM for a crawler and for anyone reading with a screen reader in
 * browse mode.
 */
export function IncidentReplay({ replay }: { replay: Replay }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [current, setCurrent] = useState(0)

  const steps = replay.steps
  const total = steps.length
  const playing = phase === 'running'

  // Resolved before the effect so the effect can depend on a primitive. Taking
  // the dependency on `steps` directly would restart the in-flight timer every
  // time a parent re-rendered and handed down a new array identity — playback
  // would stall forever in production while every test still passed.
  const hold = playing ? (steps[current]?.hold || DEFAULT_HOLD) : 0

  useEffect(() => {
    if (!playing) return

    const id = window.setTimeout(() => {
      if (current + 1 >= total) setPhase('done')
      else setCurrent(current + 1)
    }, hold)

    // Covers all three ways playback stops: unmount, pause (phase leaves
    // `running`), and skip (phase jumps to `done`). There is only ever one
    // outstanding timeout, so there is no chain to orphan.
    return () => window.clearTimeout(id)
  }, [playing, current, total, hold])

  // Hooks run before the empty-content bail-out, per the rules of hooks.
  if (total === 0) return null

  function start() {
    const reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

    // Stillness requested: the story survives, only the pacing goes.
    if (reduced) {
      setCurrent(total - 1)
      setPhase('done')
      return
    }

    setCurrent(0)
    setPhase('running')
  }

  function skip() {
    setCurrent(total - 1)
    setPhase('done')
  }

  const settled = phase === 'idle' || phase === 'done'

  function stateOf(index: number): StepState {
    if (settled) return 'done'
    if (index < current) return 'done'
    if (index === current) return 'active'
    return 'pending'
  }

  return (
    <SectionShell id="replay" eyebrow="Interactive" title={replay.title || 'Watch it work'}>
      <style dangerouslySetInnerHTML={{ __html: THINKING_CSS }} />

      {replay.intro ? (
        <p className="mb-6 max-w-xl text-[15px] leading-relaxed text-[var(--muted)]">
          {replay.intro}
        </p>
      ) : null}

      {replay.incident ? (
        <div
          className="mb-6 rounded-xl border border-[var(--accent)] bg-[var(--accent-soft)] px-4 py-3.5"
          role="note"
        >
          <p className="eyebrow mb-1.5 flex items-center gap-2 text-[var(--accent-readable)]">
            <span aria-hidden="true" className="ir-blip" />
            Alert fired
          </p>
          <p className="text-[13.5px] leading-relaxed break-words text-[var(--foreground)] sm:text-[14px]">
            {replay.incident}
          </p>
        </div>
      ) : null}

      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        {settled ? (
          <button
            type="button"
            onClick={start}
            className="rounded-lg bg-[var(--accent)] px-4 py-2.5 font-mono text-[12px] tracking-[0.06em] text-[var(--accent-contrast)] uppercase transition-opacity hover:opacity-88"
          >
            {phase === 'done' ? 'Replay' : replay.trigger || 'Run the investigation'}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setPhase(playing ? 'paused' : 'running')}
              className="rounded-lg border border-[var(--accent)] px-4 py-2.5 font-mono text-[12px] tracking-[0.06em] text-[var(--accent-readable)] uppercase transition-colors hover:bg-[var(--accent-soft)]"
            >
              {playing ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={skip}
              className="rounded-lg border border-[var(--hairline)] px-4 py-2.5 font-mono text-[12px] tracking-[0.06em] text-[var(--subtle)] uppercase transition-colors hover:text-[var(--foreground)]"
            >
              Skip to end
            </button>
          </>
        )}

        <p className="tabular ml-auto font-mono text-[11px] text-[var(--subtle)]">
          {settled ? `${total} steps` : `Step ${current + 1} of ${total}`}
        </p>
      </div>

      <ol
        aria-live="polite"
        aria-label="Investigation steps"
        className="relative flex flex-col gap-3 border-l border-[var(--hairline)] pl-4 sm:pl-5"
      >
        {steps.map((step, index) => {
          const state = stateOf(index)
          return (
            <li
              key={`${index}-${step.actor}`}
              data-testid="replay-step"
              data-state={state}
              aria-hidden={state === 'pending' ? 'true' : undefined}
              className="relative transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] data-[state=pending]:translate-y-0.5 data-[state=pending]:opacity-25"
            >
              {/* Node on the rail. Filled once the step has landed. */}
              <span
                aria-hidden="true"
                data-state={state}
                className="absolute top-[0.55rem] -left-[1.3125rem] size-[7px] rounded-full border border-[var(--hairline)] bg-[var(--background)] data-[state=active]:border-[var(--accent)] data-[state=active]:bg-[var(--accent)] data-[state=done]:border-[var(--accent)] data-[state=done]:bg-[var(--accent)] sm:-left-[1.5625rem]"
              />

              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="rounded-md border border-[var(--hairline)] bg-[var(--surface-strong)] px-2 py-0.5 font-mono text-[11px] break-words text-[var(--foreground)]">
                  {step.actor}
                </span>
                {state === 'active' ? (
                  <span data-testid="replay-thinking" aria-hidden="true" className="ir-thinking">
                    <span />
                    <span />
                    <span />
                  </span>
                ) : null}
              </div>

              <p className="mt-1.5 text-[13.5px] leading-relaxed break-words text-[var(--subtle)]">
                {step.action}
              </p>

              {step.finding ? (
                <p className="mt-1 text-[14px] leading-relaxed break-words text-[var(--foreground)]">
                  {step.finding}
                </p>
              ) : null}

              {step.citation ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-[11px] leading-snug text-[var(--accent-readable)]">
                  <span aria-hidden="true" className="opacity-60 select-none">
                    ↳
                  </span>
                  {/* The citation lives alone in its own node: it is the
                      evidence, and it must be selectable and quotable exactly. */}
                  <span className="[overflow-wrap:anywhere] break-words">{step.citation}</span>
                </p>
              ) : null}
            </li>
          )
        })}
      </ol>

      {replay.conclusion ? (
        <div
          data-testid="replay-conclusion"
          data-state={settled ? 'done' : 'pending'}
          aria-hidden={settled ? undefined : 'true'}
          className="mt-6 border-t border-[var(--hairline)] pt-5 transition-[opacity,transform] duration-500 ease-[var(--ease-out-expo)] data-[state=pending]:translate-y-1 data-[state=pending]:opacity-20"
        >
          <p className="eyebrow mb-2">Conclusion</p>
          <p className="max-w-xl text-[15px] leading-relaxed break-words text-[var(--foreground)]">
            {replay.conclusion}
          </p>
        </div>
      ) : null}
    </SectionShell>
  )
}

/**
 * The two pieces of motion that Tailwind cannot express cleanly: the pulsing
 * alert blip and the three-dot "thinking" indicator on the step in flight.
 *
 * Both are decoration — `aria-hidden`, meaning carried by the text and the live
 * region — and both stop entirely under `prefers-reduced-motion`, which the
 * indicator survives because a still row of dots still reads as a marker.
 * Colours come only from tokens; the palette is CMS-editable and a hex here
 * would silently break contrast the first time the owner changes the accent.
 */
const THINKING_CSS = `
.ir-blip{display:inline-block;width:6px;height:6px;border-radius:9999px;background:var(--accent-readable);animation:ir-blip 1.6s ease-in-out infinite}
.ir-thinking{display:inline-flex;align-items:center;gap:3px}
.ir-thinking span{display:block;width:4px;height:4px;border-radius:9999px;background:var(--accent-readable);animation:ir-dot 1.1s ease-in-out infinite}
.ir-thinking span:nth-child(2){animation-delay:.15s}
.ir-thinking span:nth-child(3){animation-delay:.3s}
@keyframes ir-blip{0%,100%{opacity:1}50%{opacity:.25}}
@keyframes ir-dot{0%,100%{opacity:.25;transform:translateY(0)}50%{opacity:1;transform:translateY(-2px)}}
@media (prefers-reduced-motion:reduce){
.ir-blip,.ir-thinking span{animation:none;opacity:1;transform:none}
}
`

export default IncidentReplay
