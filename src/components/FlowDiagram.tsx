'use client'

import { useEffect, useRef, useState, type CSSProperties } from 'react'

type FlowDiagramProps = {
  /** Ordered node labels, e.g. `["Incident", "Router agent", "Answer"]`. */
  nodes: string[]
  /** Optional caption rendered above the diagram, in the eyebrow style. */
  label?: string
  className?: string
}

/**
 * An animated system-architecture diagram, from an ordered list of labels.
 *
 * ## Why the animation is pure CSS
 *
 * A travelling pulse is the obvious candidate for `requestAnimationFrame`, and
 * that is the wrong tool here. A case-study page can carry several of these, and
 * a JS loop per diagram burns main-thread frames on decoration — on a page whose
 * job is to be read. Instead the whole sequence is expressed as CSS `@keyframes`
 * generated from the node count: the pulse offset and each node's fade-in are
 * slices of one shared cycle, so the browser runs them off the main thread and
 * they stay in lockstep for free.
 *
 * The keyframes have to be *generated* because their timing windows depend on
 * how many nodes there are — connector 3 of 4 lights at a different point in the
 * cycle than connector 3 of 6. A single static stylesheet cannot express that
 * without either a JS loop or one hardcoded ruleset per possible length. The
 * generated CSS is a pure function of `nodes.length`, so server and client emit
 * byte-identical output and hydration is quiet.
 *
 * ## Why the static form is the *lit* form
 *
 * The diagram ships from the server fully lit and motionless. That is
 * simultaneously the no-JavaScript rendering, the pre-scroll rendering, and the
 * `prefers-reduced-motion` rendering — three cases that all want the same thing:
 * the complete information, no motion. Animation is added on top only once the
 * client has confirmed the diagram is on screen *and* the reader has not asked
 * for stillness. Nothing about the diagram's meaning depends on it running.
 */
export function FlowDiagram({ nodes, label, className }: FlowDiagramProps) {
  const ref = useRef<HTMLElement>(null)
  const [running, setRunning] = useState(false)

  const count = nodes.length

  useEffect(() => {
    // A one-box "pipeline" renders nothing, so there is nothing to observe.
    if (count < 2) return

    // Read the preference synchronously rather than through a hook that settles
    // after mount: a hook that reports "no preference" on the first pass would
    // have already constructed the observer and started the cycle by the time it
    // corrected itself.
    const query =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null
    if (query?.matches) return

    // jsdom, and any browser without the API, keeps the static form forever —
    // which is a complete diagram, not a blank one.
    if (typeof IntersectionObserver === 'undefined') return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => setRunning(entries.some((entry) => entry.isIntersecting)),
      { threshold: 0.2 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [count])

  // Two nodes is the minimum that describes a flow. One is a label.
  if (count < 2) return null

  const { css, cycle } = buildKeyframes(count)

  // Read aloud as a sentence — the shapes below are decoration for text the case
  // study already carries in prose.
  const sentence = `Flow: ${nodes.join(', then ')}.`

  return (
    <figure
      ref={ref}
      className={['fd-root', className].filter(Boolean).join(' ')}
      data-flow-running={running ? 'true' : undefined}
      style={{ '--fd-cycle': `${cycle}s` } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: BASE_CSS + css }} />
      {label ? <figcaption className="fd-caption eyebrow">{label}</figcaption> : null}
      <div className="fd-viewport" role="img" aria-label={sentence}>
        <div className="fd-track" aria-hidden="true">
          {nodes.map((node, i) => (
            <FlowStep key={`${i}-${node}`} node={node} index={i} count={count} />
          ))}
        </div>
      </div>
    </figure>
  )
}

function FlowStep({ node, index, count }: { node: string; index: number; count: number }) {
  return (
    <>
      {index > 0 ? <Connector index={index - 1} count={count} /> : null}
      <div className="fd-node" data-testid="flow-node">
        <span
          className="fd-node-fill"
          style={{ '--fd-anim': `fd-in-${count}-${index}` } as CSSProperties}
        />
        <span className="fd-node-text">{node}</span>
      </div>
    </>
  )
}

/**
 * Both orientations are in the DOM; CSS shows one.
 *
 * The alternative — one stretched SVG with `preserveAspectRatio="none"` — makes
 * stroke width and dash length depend on the box's aspect ratio, so the pulse
 * would be a different thickness in each layout and at each column width. Two
 * fixed-size, unscaled viewBoxes cost a handful of hidden elements and make the
 * geometry exact instead. `pathLength="100"` normalises both to the same dash
 * arithmetic, so a single generated keyframe drives either orientation.
 */
function Connector({ index, count }: { index: number; count: number }) {
  const pulse = { '--fd-anim': `fd-pulse-${count}-${index}` } as CSSProperties

  return (
    <div className="fd-connector" data-testid="flow-connector">
      <svg className="fd-conn fd-conn-h" viewBox="0 0 28 8" aria-hidden="true" focusable="false">
        <line className="fd-rail" x1="0" y1="4" x2="28" y2="4" />
        <line className="fd-pulse" x1="0" y1="4" x2="28" y2="4" pathLength="100" style={pulse} />
      </svg>
      <svg className="fd-conn fd-conn-v" viewBox="0 0 8 26" aria-hidden="true" focusable="false">
        <line className="fd-rail" x1="4" y1="0" x2="4" y2="26" />
        <line className="fd-pulse" x1="4" y1="0" x2="4" y2="26" pathLength="100" style={pulse} />
      </svg>
    </div>
  )
}

/** Seconds a pulse spends crossing one connector. */
const STEP = 0.62
/** Seconds the completed diagram holds fully lit before the cycle restarts. */
const HOLD = 1.4
/** Seconds a node takes to come up once the pulse reaches it. */
const FADE = 0.26

/**
 * Turns a node count into the `@keyframes` that drive one full cycle.
 *
 * Every animated element runs the *same* duration (`--fd-cycle`) and differs
 * only in which slice of that duration it is active — that is what keeps a
 * five-stage diagram in step without a coordinator. Percentages are rounded to
 * two decimals so the output is stable string-for-string between renders.
 */
function buildKeyframes(count: number) {
  const cycle = Math.round((count * STEP + HOLD) * 100) / 100
  const at = (t: number) => Math.min(100, Math.round((t / cycle) * 10000) / 100)

  const blocks: string[] = []

  for (let i = 0; i < count; i += 1) {
    const start = at(i * STEP)
    const full = at(i * STEP + FADE)
    // Node 0 lights at 0%, so its "dim" stop would collide with the start stop.
    const dim = start === 0 ? '0%' : `0%, ${start}%`
    blocks.push(
      `@keyframes fd-in-${count}-${i}{${dim}{opacity:0}${full}%,100%{opacity:1}}`,
    )
  }

  for (let i = 0; i < count - 1; i += 1) {
    // The pulse leaves node i and lands exactly as node i+1 comes up.
    const start = at(i * STEP)
    const end = at((i + 1) * STEP)
    const visible = at(i * STEP + 0.04)
    const fading = at((i + 1) * STEP - 0.04)
    const hidden = start === 0 ? '0%' : `0%, ${start}%`
    blocks.push(
      `@keyframes fd-pulse-${count}-${i}{` +
        // The dash pattern's period (22 + 178) is twice `pathLength`, so the
        // pulse can start just before the rail and finish just past it without
        // the pattern wrapping around and showing a second dash.
        `${hidden}{stroke-dashoffset:222;opacity:0}` +
        `${visible}%{opacity:1}` +
        `${fading}%{opacity:1}` +
        `${end}%,100%{stroke-dashoffset:78;opacity:0}}`,
    )
  }

  return { cycle, css: blocks.join('') }
}

/**
 * Static styles. Colours come only from the token set — the palette is
 * CMS-editable and `--accent-readable` / `--accent-contrast` are computed for
 * contrast, so a hardcoded hex here would silently break WCAG AA the first time
 * the owner changes the accent.
 *
 * The `prefers-reduced-motion` block at the bottom is a second line of defence
 * behind the JS guard, and it is written at the same specificity as the
 * `[data-flow-running="true"]` rules it has to beat — a bare `.fd-pulse` there
 * would lose the cascade and be a safety net that catches nothing.
 */
const BASE_CSS = `
.fd-root{margin:0;display:flex;flex-direction:column;gap:0.625rem}
.fd-caption{margin:0}
.fd-viewport{container-type:inline-size}
.fd-track{display:flex;flex-direction:column;align-items:stretch;gap:0}
.fd-node{position:relative;min-width:0;border-radius:9px;border:1px solid var(--hairline);background:var(--surface);padding:0.5rem 0.6875rem;text-align:center}
.fd-node-fill{position:absolute;inset:-1px;border-radius:9px;border:1px solid var(--accent);background:var(--accent-soft);pointer-events:none;opacity:1}
.fd-node-text{position:relative;display:block;font-size:0.75rem;line-height:1.3;color:var(--foreground);overflow-wrap:anywhere;hyphens:auto}
.fd-connector{display:flex;align-items:center;justify-content:center;align-self:center;flex:0 0 auto}
.fd-conn{display:block;overflow:visible}
.fd-conn-h{display:none;width:28px;height:8px}
.fd-conn-v{width:8px;height:26px}
.fd-rail{stroke:var(--hairline);stroke-width:1.5;stroke-linecap:round}
.fd-pulse{stroke:var(--accent-readable);stroke-width:2.5;stroke-linecap:round;stroke-dasharray:22 178;stroke-dashoffset:222;opacity:0}
@container (min-width:620px){
.fd-track{flex-direction:row;align-items:stretch}
.fd-node{flex:1 1 0}
.fd-node-text{font-size:0.6875rem}
.fd-conn-v{display:none}
.fd-conn-h{display:block}
}
[data-flow-running="true"] .fd-node-fill{animation:var(--fd-anim) var(--fd-cycle) linear infinite both}
[data-flow-running="true"] .fd-pulse{animation:var(--fd-anim) var(--fd-cycle) linear infinite both}
@media (prefers-reduced-motion:reduce){
[data-flow-running="true"] .fd-node-fill{animation:none;opacity:1}
[data-flow-running="true"] .fd-pulse{animation:none;opacity:0}
}
`

export default FlowDiagram
