'use client'

import { useState } from 'react'
import type { ArchitectureNode, Journey } from '@/content'

/**
 * Traces one real situation through the system, hop by hop.
 *
 * The map shows what exists. This shows what *happens* — and, at each hop, the
 * product decision taken there. That second part is the whole point: naming the
 * components is architecture trivia, but "we fire the reminder ahead of the due
 * date, not on it, because a reminder without time to act is a notification
 * rather than a product" is the reasoning an interviewer is actually probing.
 *
 * Every journey's full text is rendered; only the inactive ones are `hidden`.
 * A reader without JavaScript gets all three journeys in full rather than one.
 */
export default function JourneyTrace({
  journeys,
  nodes,
}: {
  /*
   * Both lists are optional at the type boundary because callers may hold
   * architecture data written before journeys existed. Zod fills the default
   * when parsing content from disk, but a hand-built object will not have it,
   * and reading `.length` off `undefined` takes the whole section down.
   */
  journeys?: Journey[]
  nodes?: ArchitectureNode[]
}) {
  const list = journeys ?? []
  const [activeId, setActiveId] = useState(list[0]?.id ?? '')

  if (list.length === 0) return null

  const labelFor = (id: string) => (nodes ?? []).find((n) => n.id === id)?.label ?? id
  const active = list.find((j) => j.id === activeId) ?? list[0]

  return (
    <div className="mt-10 border-t border-[var(--hairline)] pt-8">
      <p className="eyebrow mb-4">Trace a journey</p>

      <div role="group" aria-label="Journeys" className="mb-6 flex flex-wrap gap-2">
        {list.map((journey) => {
          const isActive = journey.id === active.id
          return (
            <button
              key={journey.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveId(journey.id)}
              className={`rounded-lg border px-3 py-1.5 text-left text-[13px] transition-colors duration-200 motion-reduce:transition-none ${
                isActive
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--foreground)]'
                  : 'border-[var(--hairline)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--foreground)]'
              }`}
            >
              {journey.label}
            </button>
          )
        })}
      </div>

      {list.map((journey) => (
        <div
          key={journey.id}
          data-testid={`journey-${journey.id}`}
          hidden={journey.id !== active.id}
        >
          {journey.summary ? (
            <p className="mb-6 text-[15px] text-[var(--muted)]">{journey.summary}</p>
          ) : null}

          <ol className="space-y-0">
            {journey.steps.map((step, i) => (
              <li key={`${step.node}-${i}`} className="relative flex gap-4 pb-7 last:pb-0">
                {/* The rail joining the hops. Omitted on the last step so the
                    line stops at the destination rather than trailing past it. */}
                {i < journey.steps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute top-7 bottom-0 left-[13px] w-px bg-[var(--hairline)]"
                  />
                ) : null}

                <span
                  aria-hidden="true"
                  className="tabular relative z-10 mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-[var(--accent)] bg-[var(--background)] font-mono text-[11px] text-[var(--accent-readable)]"
                >
                  {i + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[11px] tracking-[0.1em] text-[var(--accent-readable)] uppercase">
                    {labelFor(step.node)}
                  </p>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--foreground)]">
                    {step.what}
                  </p>
                  {step.decision ? (
                    <p className="mt-2.5 border-l-2 border-[var(--accent)] pl-3.5 text-[14px] leading-relaxed text-[var(--muted)]">
                      <span className="font-medium text-[var(--foreground)]">Decision — </span>
                      {step.decision}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  )
}
