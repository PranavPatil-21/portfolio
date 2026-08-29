import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import JourneyTrace from '../JourneyTrace'
import type { ArchitectureNode, Journey } from '@/content'

const nodes = [
  { id: 'api', label: 'Lending API', kind: 'entry', does: 'd', why: 'w' },
  { id: 'events', label: 'Loan event stream', kind: 'stream', does: 'd', why: 'w' },
] as ArchitectureNode[]

const journeys: Journey[] = [
  {
    id: 'apply',
    label: 'An SME applies',
    summary: 'Submission to decision.',
    steps: [
      { node: 'api', what: 'Application arrives.', decision: 'Ask for documents late.' },
      { node: 'events', what: 'Decision is emitted.' },
    ],
  },
  {
    id: 'missed',
    label: 'A repayment is missed',
    summary: 'The reminder path.',
    steps: [{ node: 'events', what: 'Due event fires early.', decision: 'Fire ahead of the date.' }],
  },
]

describe('JourneyTrace', () => {
  it('returns null when there are no journeys', () => {
    const { container } = render(<JourneyTrace journeys={[]} nodes={nodes} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('resolves component ids to their human labels', () => {
    render(<JourneyTrace journeys={journeys} nodes={nodes} />)
    expect(screen.getAllByText('Lending API').length).toBeGreaterThan(0)
  })

  it('selects the first journey on mount so the panel is never empty', () => {
    render(<JourneyTrace journeys={journeys} nodes={nodes} />)
    expect(screen.getByRole('button', { name: 'An SME applies' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches journeys on click', () => {
    render(<JourneyTrace journeys={journeys} nodes={nodes} />)
    fireEvent.click(screen.getByRole('button', { name: 'A repayment is missed' }))
    expect(screen.getByRole('button', { name: 'A repayment is missed' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: 'An SME applies' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('omits the decision line when a step has none', () => {
    render(<JourneyTrace journeys={journeys} nodes={nodes} />)
    /*
     * Scoped to one journey's panel. Every journey is in the DOM — that is the
     * no-JS guarantee — so an unscoped query would also match the hidden one
     * and would assert nothing about the rendering rule.
     */
    const panel = screen.getByTestId('journey-apply')
    expect(within(panel).getAllByRole('listitem')).toHaveLength(2)
    expect(within(panel).getAllByText(/Decision —/)).toHaveLength(1)
  })

  it('ships every journey in the server HTML, not just the active one', () => {
    // The inactive journeys are `hidden`, not removed — a reader without
    // JavaScript gets all of them rather than one.
    const html = renderToStaticMarkup(<JourneyTrace journeys={journeys} nodes={nodes} />)
    expect(html).toContain('Application arrives.')
    expect(html).toContain('Due event fires early.')
    expect(html).toContain('Fire ahead of the date.')
    expect(html).not.toMatch(/opacity:\s*0/)
  })
})
