'use client'

import { useCallback, useId, useMemo, useRef, useState, type CSSProperties } from 'react'

import { SectionShell } from '@/components/ui/SectionShell'
import JourneyTrace from '@/components/sections/JourneyTrace'
import type { Architecture, ArchitectureNode } from '@/content'

type SystemMapProps = {
  architecture: Architecture
}

/**
 * An interactive map of the lending platform, where every component answers the
 * four questions you get asked about a system you claim to own: what it does,
 * why it exists, what you traded away, and what breaks without it.
 *
 * ## Why every panel is in the server HTML
 *
 * The obvious implementation renders only the selected component's detail and
 * swaps it on click. That makes the page worth one component to a crawler, to a
 * reader with JavaScript off, and to anyone printing it — and the reasoning in
 * these panels is the entire substance of the section. So all N panels are
 * rendered in full, always, and the unselected ones are hidden with the `hidden`
 * attribute. `hidden` keeps the text in the document and takes the panel out of
 * the accessibility tree, which is exactly the semantics wanted: one panel is
 * current, the rest are not. Nothing is hidden with `opacity: 0`, because an
 * opacity-hidden node is present-but-invisible — the failure mode the page's own
 * end-to-end tests exist to catch.
 *
 * ## Why the layout is computed, not measured
 *
 * Wire positions come from a pure function of the node list — bands by `kind`,
 * a fixed viewBox, percentage offsets for the buttons. Nothing is measured from
 * the DOM, so the server and the client agree byte-for-byte and the diagram is
 * correct on the first paint rather than after a layout pass. It also means the
 * whole thing survives the content being edited in the CMS: add a node, the
 * geometry re-derives.
 *
 * ## Why the nodes are buttons and the SVG is decoration
 *
 * The controls are real `<button>` elements positioned over the wires, not SVG
 * shapes with click handlers. That is what buys focus, `aria-pressed`, the
 * keyboard, and an accessible name for free. The SVG carries no semantics and is
 * `aria-hidden`; every relationship it draws is also stated in the prose of the
 * panels.
 */
export function SystemMap({ architecture }: SystemMapProps) {
  const { title, intro, nodes, edges } = architecture

  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const [selected, setSelected] = useState(0)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const layout = useMemo(() => buildLayout(nodes), [nodes])
  const wires = useMemo(() => buildWires(edges, layout), [edges, layout])

  const count = nodes.length

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (count === 0) return

      const current = buttonRefs.current.findIndex((el) => el === event.target)
      if (current < 0) return

      let next = current
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          next = (current + 1) % count
          break
        case 'ArrowLeft':
        case 'ArrowUp':
          next = (current - 1 + count) % count
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = count - 1
          break
        default:
          return
      }

      // Arrow keys and Home/End otherwise scroll the page out from under the
      // reader while they are stepping through the diagram.
      event.preventDefault()
      setSelected(next)
      buttonRefs.current[next]?.focus()
    },
    [count],
  )

  if (count === 0) return null

  const selectedId = layout.placed[selected]?.node.id

  return (
    <SectionShell id="architecture" title={title || 'Architecture'}>
      {intro ? (
        <p className="mb-8 max-w-2xl text-[15px] leading-relaxed text-[var(--muted)]">{intro}</p>
      ) : null}

      <div className="sm-root">
        <style dangerouslySetInnerHTML={{ __html: CSS }} />

        <div
          className="sm-stage"
          role="group"
          aria-label="System components — select one to read its detail"
          onKeyDown={onKeyDown}
        >
          <div className="sm-plot">
            <svg
              className="sm-wires"
              viewBox={`0 0 100 ${layout.height}`}
              aria-hidden="true"
              focusable="false"
            >
              {wires.map((wire) => {
                const active = wire.from === selectedId || wire.to === selectedId
                return (
                  <g
                    key={`${wire.from}__${wire.to}`}
                    data-edge={`${wire.from}__${wire.to}`}
                    data-edge-active={active ? 'true' : 'false'}
                  >
                    <path className="sm-wire" d={wire.d} />
                    <circle className="sm-wire-end" cx={wire.endX} cy={wire.endY} r="1.1" />
                    {/*
                      Labels only on the edges touching the selected component.
                      Rendering all of them at once put nine short strings into
                      a small box where they collided with each other and with
                      the node boxes — the diagram read as broken rather than
                      annotated. Shown on demand, each one has room.
                    */}
                    {wire.label && active ? (
                      <text className="sm-wire-label" x={wire.labelX} y={wire.labelY}>
                        {wire.label}
                      </text>
                    ) : null}
                  </g>
                )
              })}
            </svg>

            {layout.placed.map((placement, index) => {
              const node = placement.node
              const isSelected = index === selected
              return (
                <button
                  key={node.id}
                  ref={(el) => {
                    buttonRefs.current[index] = el
                  }}
                  type="button"
                  id={`${uid}-node-${node.id}`}
                  className="sm-node"
                  data-selected={isSelected ? 'true' : 'false'}
                  aria-pressed={isSelected}
                  aria-controls={`${uid}-panel-${node.id}`}
                  onClick={() => setSelected(index)}
                  style={
                    {
                      '--sm-x': placement.x,
                      '--sm-y': (placement.y / layout.height) * 100,
                      '--sm-w': placement.w,
                      '--sm-row': index <= selected ? index + 1 : index + 2,
                    } as CSSProperties
                  }
                >
                  <span className="sm-node-kind">{KIND_LABEL[node.kind]}</span>
                  <span className="sm-node-label">{node.label}</span>
                </button>
              )
            })}
          </div>

          {layout.placed.map(({ node }, index) => (
            <div
              key={node.id}
              id={`${uid}-panel-${node.id}`}
              data-testid={`system-map-panel-${node.id}`}
              className="sm-panel"
              role="region"
              aria-labelledby={`${uid}-node-${node.id}`}
              hidden={index !== selected}
              style={{ '--sm-panel-row': selected + 2 } as CSSProperties}
            >
              <div className="sm-panel-head">
                <h3 className="heading text-[17px] leading-tight">{node.label}</h3>
                <span className="eyebrow">{KIND_LABEL[node.kind]}</span>
              </div>

              <dl className="sm-fields">
                <Field label="What it does" value={node.does} />
                <Field label="Why it exists" value={node.why} />
                <Field label="What I traded away" value={node.tradeoff} />
                <Field label="What breaks without it" value={node.failure} />
                <Field label="Scale" value={node.scale} tabular />
              </dl>
            </div>
          ))}
        </div>
      </div>
      <JourneyTrace journeys={architecture.journeys} nodes={architecture.nodes} />
    </SectionShell>
  )
}

/**
 * A single labelled fact. Absent values render nothing at all rather than an
 * empty heading — a "Scale" label with no number under it reads as an omission
 * the author did not notice.
 */
function Field({
  label,
  value,
  tabular = false,
}: {
  label: string
  value?: string
  tabular?: boolean
}) {
  if (!value) return null
  return (
    <div className="sm-field">
      <dt className="eyebrow">{label}</dt>
      <dd className={`sm-field-value${tabular ? ' tabular' : ''}`}>{value}</dd>
    </div>
  )
}

const KIND_LABEL: Record<ArchitectureNode['kind'], string> = {
  entry: 'Entry point',
  stream: 'Event stream',
  service: 'Service',
  store: 'Data store',
  external: 'External',
}

type Placement = {
  node: ArchitectureNode
  /** Horizontal centre, in percent of the plot width. */
  x: number
  /** Vertical centre, in the SVG's user units. */
  y: number
  /** Box width, in percent of the plot width. */
  w: number
}

type Layout = {
  placed: Placement[]
  byId: Map<string, Placement>
  height: number
}

/** Vertical space one band occupies, in SVG user units (the viewBox is 100 wide). */
const BAND_H = 20

/**
 * Places nodes into horizontal bands by `kind`.
 *
 * Entry points sit at the top because that is where requests arrive. Streams and
 * services occupy the middle column — they are the moving parts. Stores and
 * external dependencies are pushed to the left and right extremes, because they
 * are the edges of the system in both senses: peripheral in the diagram, and the
 * boundary past which this platform stops being responsible for correctness.
 *
 * Everything downstream (wire geometry, button offsets, the stage's aspect
 * ratio) derives from this, so the diagram re-flows correctly when the content
 * changes without anyone touching the CSS.
 */
function buildLayout(nodes: ArchitectureNode[]): Layout {
  const entry = nodes.filter((n) => n.kind === 'entry')
  const middle = [
    ...nodes.filter((n) => n.kind === 'stream'),
    ...nodes.filter((n) => n.kind === 'service'),
  ]
  const flank = nodes.filter((n) => n.kind === 'store' || n.kind === 'external')

  const bands: ArchitectureNode[][] = []
  chunk(entry, 3).forEach((row) => bands.push(row))
  chunk(middle, 3).forEach((row) => bands.push(row))
  const flankStart = bands.length
  chunk(flank, 2).forEach((row) => bands.push(row))

  const placed: Placement[] = []

  bands.forEach((row, bandIndex) => {
    const y = bandIndex * BAND_H + BAND_H / 2
    const isFlank = bandIndex >= flankStart
    row.forEach((node, i) => {
      placed.push({ node, y, x: columnX(i, row.length, isFlank), w: columnW(row.length, isFlank) })
    })
  })

  // Preserve the author's ordering for the DOM and the keyboard: banding is a
  // visual decision and should not reshuffle tab order.
  const order = new Map(nodes.map((node, i) => [node.id, i]))
  placed.sort((a, b) => (order.get(a.node.id) ?? 0) - (order.get(b.node.id) ?? 0))

  return {
    placed,
    byId: new Map(placed.map((p) => [p.node.id, p])),
    height: Math.max(bands.length, 1) * BAND_H,
  }
}

/** Flank rows hug the extremes; middle rows spread symmetrically about centre. */
function columnX(index: number, total: number, isFlank: boolean) {
  // 17 rather than 0: the box is centred on this point and is `w` wide, so a
  // smaller value pushes the left flank past the plot's edge and clips it
  // against the content column.
  if (isFlank) return total > 1 ? 17 + index * (66 / (total - 1)) : 17
  const gap = total >= 3 ? 30 : 40
  return 50 + (index - (total - 1) / 2) * gap
}

/**
 * Boxes are deliberately narrower than their slot. The leftover space is the
 * corridor a long wire needs to get past a band it is only travelling through —
 * without it, `buildWires` has nowhere to route and every hop across the middle
 * of the diagram has to cut through a component it has nothing to do with.
 */
function columnW(total: number, isFlank: boolean) {
  if (isFlank) return 26
  return total >= 3 ? 26 : 34
}

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

type Wire = {
  from: string
  to: string
  d: string
  endX: number
  endY: number
  label?: string
  labelX: number
  labelY: number
}

/** Bow magnitudes to try, as a fraction of the edge's straight-line length. */
const BOWS = [0.16, 0.26, 0.38, 0.5, 0.64, 0.8]
/** Points along the curve that get tested for collisions. */
const SAMPLES = [0.15, 0.3, 0.45, 0.6, 0.75, 0.9]

/**
 * Turns edges into bowed connectors, choosing each bow by what it has to miss.
 *
 * The bow is not decoration. A straight line between two nodes several bands
 * apart passes straight through whatever sits between them, and because the
 * buttons paint opaquely on top of the wires, the result reads as though the
 * wire *terminates* at the box it happens to cross — the diagram then says
 * something the data does not.
 *
 * A fixed curvature does not solve this: how far a wire must swing depends
 * entirely on what is in its way, which is a property of the content, not of the
 * geometry. So each edge is routed by search — try both sides and a ladder of
 * bow magnitudes, sample each candidate curve, and keep the cheapest one, where
 * cost is (boxes clipped) plus (samples pushed off the plot) plus a small
 * preference for the gentlest curve that works. The result is a straight line
 * when nothing is in the way and a deliberate arc when something is.
 *
 * Measured against the real eight-node platform this takes the number of wires
 * cutting through an unrelated component from nine to one marginal corner graze.
 *
 * Edges pointing at a node that no longer exists are dropped rather than drawn
 * to the origin — the content is CMS-editable, and a deleted node should not
 * leave a wire hanging off the top-left corner.
 */
function buildWires(edges: Architecture['edges'], layout: Layout): Wire[] {
  const wires: Wire[] = []

  for (const edge of edges) {
    const a = layout.byId.get(edge.from)
    const b = layout.byId.get(edge.to)
    if (!a || !b) continue

    const dx = b.x - a.x
    const dy = b.y - a.y
    const len = Math.hypot(dx, dy)
    if (len === 0) continue

    const midX = (a.x + b.x) / 2
    const midY = (a.y + b.y) / 2

    // Stop short of the target so the dot reads as an arrival, not an overlap.
    const endX = b.x - (dx / len) * 1.5
    const endY = b.y - (dy / len) * 1.5

    const obstacles = layout.placed.filter(
      (p) => p.node.id !== edge.from && p.node.id !== edge.to,
    )

    let cx = midX
    let cy = midY
    let bestCost = Infinity

    for (const side of [1, -1]) {
      for (const bow of BOWS) {
        const k = Math.min(len * bow, 36)
        const candX = midX + side * ((-dy / len) * k)
        const candY = midY + side * ((dx / len) * k)

        let cost = bow
        for (const t of SAMPLES) {
          const u = 1 - t
          const x = u * u * a.x + 2 * u * t * candX + t * t * endX
          const y = u * u * a.y + 2 * u * t * candY + t * t * endY
          for (const o of obstacles) {
            if (Math.abs(x - o.x) < o.w / 2 + 1 && Math.abs(y - o.y) < 5) cost += 10
          }
          if (x < 1 || x > 99) cost += 6
        }

        if (cost < bestCost) {
          bestCost = cost
          cx = candX
          cy = candY
        }
      }
    }

    wires.push({
      from: edge.from,
      to: edge.to,
      d: `M ${round(a.x)} ${round(a.y)} Q ${round(cx)} ${round(cy)} ${round(endX)} ${round(endY)}`,
      endX: round(endX),
      endY: round(endY),
      // The point at t=0.5 on the quadratic — where the wire actually is, not
      // where the straight-line midpoint would have been.
      labelX: round(0.25 * a.x + 0.5 * cx + 0.25 * endX),
      labelY: round(0.25 * a.y + 0.5 * cy + 0.25 * endY - 1.2),
      // Below this length the label is wider than the wire it annotates and
      // collides with both endpoints.
      label: len >= 16 ? (edge.label ?? undefined) : undefined,
    })
  }

  return wires
}

function round(n: number) {
  return Math.round(n * 100) / 100
}

/**
 * Styles.
 *
 * Mobile-first: the stage is a single-column grid and the wires are hidden,
 * because a scaled-down node graph on a 320px screen is unreadable and the
 * panels are the payload. The selected panel is placed by grid row directly
 * beneath its own button, so the answer appears where the reader just tapped
 * rather than at the bottom of a list of eight boxes. Every grid row holds
 * exactly one item — the hidden panels are `display: none` — so `gap` does not
 * open holes where the unselected panels would have been.
 *
 * The desktop form is a container query, not a media query: this renders inside
 * a content column beside a rail, so the viewport width is the wrong number to
 * ask about.
 *
 * Colours are tokens only. The palette is CMS-editable and `--accent-readable` /
 * `--accent-contrast` are the values computed to hold WCAG AA against it, so a
 * literal hex here would break contrast the first time the owner picks a new
 * accent.
 *
 * The `prefers-reduced-motion` block is written at the same specificity as the
 * rules it overrides, so it actually wins the cascade rather than being a safety
 * net that silently catches nothing.
 */
const CSS = `
.sm-root{container-type:inline-size}
.sm-stage{display:grid;grid-template-columns:minmax(0,1fr);gap:0.5rem}
.sm-plot{display:contents}
.sm-wires{display:none}
.sm-node{grid-row:var(--sm-row);display:flex;flex-direction:column;gap:0.1875rem;align-items:flex-start;text-align:left;border-radius:10px;border:1px solid var(--hairline);background-color:var(--background);background-image:linear-gradient(var(--surface),var(--surface));padding:0.5rem 0.6875rem;cursor:pointer;transition:border-color 200ms var(--ease-out-expo),background-image 200ms var(--ease-out-expo)}
.sm-node:hover{border-color:color-mix(in oklab,var(--accent) 45%,transparent)}
.sm-node[data-selected="true"]{border-color:var(--accent);background-image:linear-gradient(var(--accent-soft),var(--accent-soft))}
.sm-node-kind{font-family:var(--font-mono),ui-monospace,monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:var(--subtle);line-height:1.2}
.sm-node[data-selected="true"] .sm-node-kind{color:var(--accent-readable)}
.sm-node-label{font-size:13px;line-height:1.25;color:var(--foreground);overflow-wrap:anywhere;hyphens:auto}
.sm-panel{grid-row:var(--sm-panel-row);border-radius:12px;border:1px solid color-mix(in oklab,var(--accent) 30%,var(--hairline));background:var(--surface-strong);padding:1rem 1.0625rem}
.sm-panel[hidden]{display:none}
.sm-panel-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:0.5rem 0.75rem;margin-bottom:0.875rem}
.sm-fields{display:grid;gap:0.875rem;margin:0}
.sm-field{margin:0}
.sm-field dt{margin:0 0 0.25rem}
.sm-field-value{margin:0;font-size:14px;line-height:1.6;color:var(--muted)}
.sm-wire{fill:none;stroke:var(--hairline);stroke-width:1.5;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:0.75;transition:stroke 200ms var(--ease-out-expo),opacity 200ms var(--ease-out-expo)}
.sm-wire-end{fill:var(--hairline);transition:fill 200ms var(--ease-out-expo),opacity 200ms var(--ease-out-expo)}
.sm-wire-label{fill:var(--subtle);font-family:var(--font-mono),ui-monospace,monospace;font-size:2.1px;letter-spacing:0.06em;text-anchor:middle;opacity:0.85;transition:fill 200ms var(--ease-out-expo),opacity 200ms var(--ease-out-expo)}
[data-edge-active="false"] .sm-wire{opacity:0.35}
[data-edge-active="false"] .sm-wire-end{opacity:0.35}
[data-edge-active="false"] .sm-wire-label{opacity:0.4}
[data-edge-active="true"] .sm-wire{stroke:var(--accent-readable);stroke-width:2;opacity:1}
[data-edge-active="true"] .sm-wire-end{fill:var(--accent-readable);opacity:1}
[data-edge-active="true"] .sm-wire-label{fill:var(--accent-readable);opacity:1}
@container (min-width:560px){
.sm-stage{display:block}
.sm-plot{display:block;position:relative}
.sm-wires{display:block;width:100%;height:auto;overflow:visible}
.sm-node{position:absolute;left:calc(var(--sm-x) * 1%);top:calc(var(--sm-y) * 1%);width:calc(var(--sm-w) * 1%);transform:translate(-50%,-50%);align-items:center;text-align:center}
.sm-node-label{font-size:12px}
.sm-panel{margin-top:1.5rem;padding:1.125rem 1.25rem}
.sm-fields{gap:1rem}
}
@media (prefers-reduced-motion:reduce){
.sm-node{transition:none}
.sm-wire{transition:none}
.sm-wire-end{transition:none}
.sm-wire-label{transition:none}
[data-edge-active="true"] .sm-wire{transition:none}
[data-edge-active="true"] .sm-wire-end{transition:none}
[data-edge-active="true"] .sm-wire-label{transition:none}
}
`

export default SystemMap
