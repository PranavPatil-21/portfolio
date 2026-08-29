import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import FlowDiagram from '../FlowDiagram'

const WIOGENIE = ['Incident', 'Router agent', 'Code · Logs · Jira · RCA', 'Citation check', 'Answer']

/**
 * jsdom ships no `matchMedia`. A partial stub silently reports "no preference",
 * which would make the reduced-motion tests pass against the wrong branch — so
 * the stub carries the full `MediaQueryList` surface `motion` subscribes to.
 */
function mockMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }))
}

/**
 * jsdom has no `IntersectionObserver` either. The component must survive its
 * absence (it guards, like `Reveal` does), but the reduced-motion assertion
 * needs to prove the observer was never *constructed* — pre-scroll static and
 * reduced-motion static render identical DOM, so the observer call is the only
 * thing that tells the two branches apart.
 */
let observerSpy: Mock<(...args: unknown[]) => void>

function mockObserver() {
  observerSpy = vi.fn<(...args: unknown[]) => void>()
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(...args: unknown[]) {
        observerSpy(...args)
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
      root = null
      rootMargin = ''
      thresholds = []
    },
  )
}

beforeEach(() => {
  vi.unstubAllGlobals()
  mockMedia(false)
  mockObserver()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('FlowDiagram', () => {
  it('renders one node per label', () => {
    render(<FlowDiagram nodes={WIOGENIE} />)
    const nodes = screen.getAllByTestId('flow-node')
    expect(nodes).toHaveLength(WIOGENIE.length)
    expect(nodes.map((n) => n.textContent)).toEqual(WIOGENIE)
  })

  it('returns null for zero nodes', () => {
    const { container } = render(<FlowDiagram nodes={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('returns null for a single node — one box is not a pipeline', () => {
    const { container } = render(<FlowDiagram nodes={['Incident']} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a connector between every adjacent pair, not one per node', () => {
    render(<FlowDiagram nodes={WIOGENIE} />)
    expect(screen.getAllByTestId('flow-connector')).toHaveLength(WIOGENIE.length - 1)
  })

  it('describes the whole flow as a sentence on a single role="img" element', () => {
    render(<FlowDiagram nodes={WIOGENIE} />)
    const figure = screen.getByRole('img')
    expect(figure).toHaveAttribute(
      'aria-label',
      'Flow: Incident, then Router agent, then Code · Logs · Jira · RCA, then Citation check, then Answer.',
    )
  })

  it('hides the internal shapes from assistive tech', () => {
    render(<FlowDiagram nodes={WIOGENIE} />)
    for (const node of screen.getAllByTestId('flow-node')) {
      expect(node.closest('[aria-hidden="true"]')).not.toBeNull()
    }
  })

  it('keeps an optional label out of the aria-label element so it stays readable', () => {
    render(<FlowDiagram nodes={WIOGENIE} label="Investigation path" />)
    const caption = screen.getByText('Investigation path')
    expect(caption).toBeInTheDocument()
    expect(screen.getByRole('img').contains(caption)).toBe(false)
  })

  it('renders static and starts nothing under reduced motion', () => {
    mockMedia(true)
    const setInterval = vi.spyOn(globalThis, 'setInterval')
    const raf = vi.fn()
    vi.stubGlobal('requestAnimationFrame', raf)

    render(<FlowDiagram nodes={WIOGENIE} />)

    // Every label survives — only the motion goes.
    for (const label of WIOGENIE) expect(screen.getByText(label)).toBeInTheDocument()
    // No observer, no timers, no frame loop.
    expect(observerSpy).not.toHaveBeenCalled()
    expect(setInterval).not.toHaveBeenCalled()
    expect(raf).not.toHaveBeenCalled()
    // And the class that switches the CSS keyframes on is never applied.
    expect(document.querySelector('[data-flow-running="true"]')).toBeNull()
  })

  it('does not mark itself running on the first client paint, before it is seen', () => {
    render(<FlowDiagram nodes={WIOGENIE} />)
    expect(document.querySelector('[data-flow-running="true"]')).toBeNull()
  })

  it('handles a very long label without throwing', () => {
    const long = 'Idempotent consumer '.repeat(20).trim()
    expect(() => render(<FlowDiagram nodes={['Loan events', long, 'Statement']} />)).not.toThrow()
    expect(screen.getByText(long)).toBeInTheDocument()
  })

  it('is SSR-safe — the static markup carries every label', () => {
    const html = renderToStaticMarkup(<FlowDiagram nodes={WIOGENIE} label="Pipeline" />)
    for (const label of WIOGENIE) expect(html).toContain(label)
    expect(html).toContain('Pipeline')
    expect(html).toContain('role="img"')
    // Server output must not claim to be animating — the client turns that on.
    // (The string also appears inside the stylesheet as a selector, so this
    // has to look at the element, not the whole document.)
    expect(html).not.toMatch(/<figure[^>]*data-flow-running/)
  })

  it('emits keyframes that are a pure function of the node count', () => {
    const a = renderToStaticMarkup(<FlowDiagram nodes={WIOGENIE} />)
    const b = renderToStaticMarkup(<FlowDiagram nodes={WIOGENIE} />)
    expect(a).toEqual(b)
  })
})
