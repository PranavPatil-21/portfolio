import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Architecture } from '@/content'

import SystemMap from '../SystemMap'

/**
 * The section exists to survive an interviewer poking at it, so the tests are
 * about two things: that every component's full reasoning is in the document
 * before anyone clicks anything (the no-JS / crawler guarantee), and that the
 * control surface behaves like a real set of buttons.
 */

function makeArchitecture(overrides: Partial<Architecture> = {}): Architecture {
  return {
    enabled: true,
    title: 'The lending platform, component by component',
    intro: 'Pick any component to see what it does and what it cost.',
    nodes: [
      {
        id: 'api',
        label: 'Lending API',
        kind: 'entry',
        does: 'The synchronous surface every lending journey talks to.',
        why: 'Multiple products need the same loan lifecycle.',
        tradeoff: 'Product behaviour lives behind flags rather than its own service.',
        failure: 'Product teams build their own flows and definitions drift.',
        scale: 'Retail and SME credit products',
      },
      {
        id: 'events',
        label: 'Loan event stream',
        kind: 'stream',
        does: 'Kafka topics carrying every state change in a loan.',
        why: 'Billing and notifications react to the same state changes.',
        tradeoff: 'Asynchrony buys decoupling and costs certainty.',
        failure: 'A reversal applied before its charge produces a wrong balance.',
        scale: 'Partitioned by account',
      },
      {
        id: 'billing',
        label: 'Billing engine',
        kind: 'service',
        does: 'Turns loan events into monthly statements.',
        why: 'A statement is the most-read artefact a lending customer receives.',
        tradeoff: 'Every handler is idempotent, which costs bookkeeping on every write.',
        failure: 'One redelivered event double-charges a customer.',
        scale: '99% accuracy across 100K+ monthly statements',
      },
      {
        id: 'postgres',
        label: 'PostgreSQL',
        kind: 'store',
        does: 'System of record for loans, schedules and balances.',
        why: 'Money needs a single authoritative place where a balance is true.',
        // no tradeoff, no failure, no scale — the sparse-node case.
      },
    ],
    edges: [
      { from: 'api', to: 'events', label: 'emits' },
      { from: 'events', to: 'billing' },
      { from: 'billing', to: 'postgres', label: 'reconciles' },
    ],
    ...overrides,
  } as Architecture
}

const FIELD_LABELS = {
  does: 'What it does',
  why: 'Why it exists',
  tradeoff: 'What I traded away',
  failure: 'What breaks without it',
  scale: 'Scale',
}

function nodeButton(name: RegExp) {
  return screen.getByRole('button', { name })
}

describe('SystemMap', () => {
  it('renders nothing when there are no nodes', () => {
    const { container } = render(<SystemMap architecture={makeArchitecture({ nodes: [] })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders the section title and intro from the data', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    expect(screen.getByText('The lending platform, component by component')).toBeInTheDocument()
    expect(
      screen.getByText('Pick any component to see what it does and what it cost.'),
    ).toBeInTheDocument()
  })

  it('uses the architecture section id', () => {
    const { container } = render(<SystemMap architecture={makeArchitecture()} />)
    expect(container.querySelector('section#architecture')).not.toBeNull()
  })

  it('renders every node as a real button with an accessible name', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    for (const node of makeArchitecture().nodes) {
      expect(nodeButton(new RegExp(node.label, 'i'))).toBeInstanceOf(HTMLButtonElement)
    }
  })

  it('groups the node buttons so a screen reader reads them as one control set', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const group = screen.getByRole('group')
    expect(group).toBeInTheDocument()
    expect(group.querySelectorAll('button').length).toBe(4)
  })

  it('keeps every node button tab-reachable', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const buttons = screen.getByRole('group').querySelectorAll('button')
    buttons.forEach((button) => {
      expect(button.getAttribute('tabindex')).not.toBe('-1')
    })
  })

  // The no-JS / crawler guarantee: the server HTML alone carries every
  // component's full reasoning, before any hydration or interaction.
  it('puts every field of every node in the server-rendered markup', () => {
    const architecture = makeArchitecture()
    const html = renderToStaticMarkup(<SystemMap architecture={architecture} />)

    for (const node of architecture.nodes) {
      expect(html).toContain(node.label)
      for (const key of ['does', 'why', 'tradeoff', 'failure', 'scale'] as const) {
        const value = node[key]
        if (!value) continue
        expect(html, `${node.id}.${key} missing from server HTML`).toContain(value)
      }
    }
  })

  it('does not hide detail behind opacity in the server markup', () => {
    const html = renderToStaticMarkup(<SystemMap architecture={makeArchitecture()} />)
    expect(html).not.toMatch(/opacity:\s*0[^.\d]/)
  })

  it('has every panel in the client DOM too, with only the selected one shown', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const architecture = makeArchitecture()

    for (const node of architecture.nodes) {
      const panel = screen.getByTestId(`system-map-panel-${node.id}`)
      expect(panel).toHaveTextContent(node.does)
      expect(panel).toHaveTextContent(node.why)
    }

    expect(screen.getByTestId('system-map-panel-api')).not.toHaveAttribute('hidden')
    expect(screen.getByTestId('system-map-panel-events')).toHaveAttribute('hidden')
    expect(screen.getByTestId('system-map-panel-billing')).toHaveAttribute('hidden')
    expect(screen.getByTestId('system-map-panel-postgres')).toHaveAttribute('hidden')
  })

  it('selects the first node on mount rather than showing an empty prompt', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    expect(nodeButton(/Lending API/i)).toHaveAttribute('aria-pressed', 'true')
    expect(nodeButton(/Loan event stream/i)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('system-map-panel-api')).not.toHaveAttribute('hidden')
  })

  it('swaps the visible panel and moves aria-pressed on click', () => {
    render(<SystemMap architecture={makeArchitecture()} />)

    fireEvent.click(nodeButton(/Billing engine/i))

    expect(nodeButton(/Billing engine/i)).toHaveAttribute('aria-pressed', 'true')
    expect(nodeButton(/Lending API/i)).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('system-map-panel-billing')).not.toHaveAttribute('hidden')
    expect(screen.getByTestId('system-map-panel-api')).toHaveAttribute('hidden')
  })

  it('moves selection with the arrow keys', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const first = nodeButton(/Lending API/i)
    first.focus()

    fireEvent.keyDown(first, { key: 'ArrowRight' })
    expect(nodeButton(/Loan event stream/i)).toHaveAttribute('aria-pressed', 'true')
    // Selection without focus strands the keyboard user on the previous node.
    expect(nodeButton(/Loan event stream/i)).toHaveFocus()
    expect(screen.getByTestId('system-map-panel-events')).not.toHaveAttribute('hidden')

    fireEvent.keyDown(nodeButton(/Loan event stream/i), { key: 'ArrowDown' })
    expect(nodeButton(/Billing engine/i)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(nodeButton(/Billing engine/i), { key: 'ArrowLeft' })
    expect(nodeButton(/Loan event stream/i)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(nodeButton(/Loan event stream/i), { key: 'Home' })
    expect(nodeButton(/Lending API/i)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(nodeButton(/Lending API/i), { key: 'End' })
    expect(nodeButton(/PostgreSQL/i)).toHaveAttribute('aria-pressed', 'true')
  })

  it('wraps arrow-key selection at both ends', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const first = nodeButton(/Lending API/i)
    first.focus()

    fireEvent.keyDown(first, { key: 'ArrowLeft' })
    expect(nodeButton(/PostgreSQL/i)).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(nodeButton(/PostgreSQL/i), { key: 'ArrowRight' })
    expect(nodeButton(/Lending API/i)).toHaveAttribute('aria-pressed', 'true')
  })

  it('labels every field it renders', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const panel = screen.getByTestId('system-map-panel-api')
    for (const label of Object.values(FIELD_LABELS)) {
      expect(panel).toHaveTextContent(label)
    }
  })

  it('omits the labels for fields a node does not have', () => {
    render(<SystemMap architecture={makeArchitecture()} />)
    const panel = screen.getByTestId('system-map-panel-postgres')

    expect(panel).toHaveTextContent(FIELD_LABELS.does)
    expect(panel).toHaveTextContent(FIELD_LABELS.why)
    expect(panel).not.toHaveTextContent(FIELD_LABELS.tradeoff)
    expect(panel).not.toHaveTextContent(FIELD_LABELS.failure)
    expect(panel).not.toHaveTextContent(FIELD_LABELS.scale)
  })

  it('draws a connector for every edge and emphasises the ones touching the selection', () => {
    const { container } = render(<SystemMap architecture={makeArchitecture()} />)
    const edges = container.querySelectorAll('[data-edge]')
    expect(edges.length).toBe(3)

    const active = container.querySelectorAll('[data-edge-active="true"]')
    // Only `api -> events` touches the initially selected `api`.
    expect(active.length).toBe(1)
    expect(active[0].getAttribute('data-edge')).toBe('api__events')
  })

  it('labels only the edges touching the selected component', () => {
    /*
     * Rendering all edge labels at once put every short string into the same
     * small box, where they collided with each other and with the node boxes —
     * the diagram read as broken rather than annotated. They now appear on the
     * selection's own edges, where each has room.
     */
    const { container } = render(<SystemMap architecture={makeArchitecture()} />)
    // `api` is selected on mount, so its outgoing label shows...
    expect(container.textContent).toContain('emits')
    // ...while an edge between two other components stays unlabelled.
    expect(container.textContent).not.toContain('reconciles')
  })

  it('reveals a label once its edge becomes part of the selection', () => {
    const { container } = render(<SystemMap architecture={makeArchitecture()} />)
    fireEvent.click(screen.getByRole('button', { name: /billing/i }))
    expect(container.textContent).toContain('reconciles')
  })

  it('honours prefers-reduced-motion in the styles it emits', () => {
    const { container } = render(<SystemMap architecture={makeArchitecture()} />)
    const css = Array.from(container.querySelectorAll('style'))
      .map((style) => style.textContent ?? '')
      .join('')
    expect(css).toContain('prefers-reduced-motion')
    expect(css).toMatch(/prefers-reduced-motion[\s\S]*transition\s*:\s*none/)
  })

  it('survives an edge that points at a node that does not exist', () => {
    const architecture = makeArchitecture({
      edges: [
        { from: 'api', to: 'nowhere', label: 'dangling' },
        { from: 'api', to: 'events', label: 'emits' },
      ],
    })
    const { container } = render(<SystemMap architecture={architecture} />)
    expect(container.querySelectorAll('[data-edge]').length).toBe(1)
  })
})
