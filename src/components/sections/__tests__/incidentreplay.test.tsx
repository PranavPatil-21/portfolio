import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import type { Replay } from '@/content'

import IncidentReplay from '../IncidentReplay'

/**
 * The interactive piece. Two properties matter more than the animation:
 *
 * 1. The entire script is in the server-rendered DOM before any interaction —
 *    a crawler and a reader without JavaScript get the whole story.
 * 2. Nobody is ever trapped waiting: pause, resume and skip are always honoured,
 *    and `prefers-reduced-motion` skips the pacing entirely.
 */

function makeReplay(overrides: Partial<Replay> = {}): Replay {
  return {
    enabled: true,
    title: 'Watch it work',
    intro: 'An illustrative walkthrough of the investigator.',
    trigger: 'Run the investigation',
    incident: '02:14 — repayment notification failures spike to 4%.',
    steps: [
      {
        actor: 'Router',
        action: 'Reads the alert.',
        finding: 'Consumer-side failure, not a provider outage.',
        citation: undefined,
        hold: 1000,
      },
      {
        actor: 'Logs agent',
        action: 'Scans the consumer group.',
        finding: 'Rebalance storm — fourteen rebalances in nine minutes.',
        citation: 'kibana · lending-notification-consumer',
        hold: 1000,
      },
      {
        actor: 'Synthesis',
        action: 'Assembles the answer.',
        finding: 'Processing outgrew the poll interval.',
        citation: '3 sources cited · 0 uncited claims',
        hold: 1000,
      },
    ],
    conclusion: 'Root cause in under a minute, every claim traceable.',
    ...overrides,
  } as Replay
}

function mockMatchMedia(reduced: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

/** Playback state of one step, as the component records it on the DOM. */
function stepStates(): string[] {
  return screen
    .getAllByTestId('replay-step')
    .map((el) => el.getAttribute('data-state') ?? '')
}

function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms)
  })
}

beforeEach(() => {
  vi.useFakeTimers()
  mockMatchMedia(false)
})

afterEach(() => {
  vi.useRealTimers()
})

describe('IncidentReplay', () => {
  it('renders nothing when there are no steps', () => {
    const { container } = render(<IncidentReplay replay={makeReplay({ steps: [] })} />)
    expect(container.firstChild).toBeNull()
  })

  it('ships the whole script in the DOM before any interaction', () => {
    const replay = makeReplay()
    render(<IncidentReplay replay={replay} />)

    expect(screen.getByText(replay.incident)).toBeInTheDocument()
    expect(screen.getByText(replay.intro)).toBeInTheDocument()
    expect(screen.getByText(replay.conclusion)).toBeInTheDocument()

    for (const step of replay.steps) {
      expect(screen.getByText(step.actor)).toBeInTheDocument()
      expect(screen.getByText(step.action)).toBeInTheDocument()
      if (step.finding) expect(screen.getByText(step.finding)).toBeInTheDocument()
      if (step.citation) expect(screen.getByText(step.citation)).toBeInTheDocument()
    }

    // Every step reads as complete before playback, so nothing is dimmed or
    // hidden for a reader without JavaScript.
    expect(stepStates()).toEqual(['done', 'done', 'done'])
  })

  it('advances one step at a time as each hold elapses', () => {
    render(<IncidentReplay replay={makeReplay()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))
    expect(stepStates()).toEqual(['active', 'pending', 'pending'])

    advance(1000)
    expect(stepStates()).toEqual(['done', 'active', 'pending'])

    advance(1000)
    expect(stepStates()).toEqual(['done', 'done', 'active'])

    advance(1000)
    expect(stepStates()).toEqual(['done', 'done', 'done'])
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument()
  })

  it('pauses and resumes playback', () => {
    render(<IncidentReplay replay={makeReplay()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))

    advance(1000)
    expect(stepStates()).toEqual(['done', 'active', 'pending'])

    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(vi.getTimerCount()).toBe(0)

    advance(5000)
    expect(stepStates()).toEqual(['done', 'active', 'pending'])

    fireEvent.click(screen.getByRole('button', { name: /resume/i }))
    advance(1000)
    expect(stepStates()).toEqual(['done', 'done', 'active'])
  })

  it('skips to the end on demand', () => {
    render(<IncidentReplay replay={makeReplay()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))

    fireEvent.click(screen.getByRole('button', { name: /skip to end/i }))

    expect(stepStates()).toEqual(['done', 'done', 'done'])
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.getByTestId('replay-conclusion')).toHaveAttribute('data-state', 'done')
    expect(screen.getByRole('button', { name: /replay/i })).toBeInTheDocument()
  })

  it('restarts from the beginning on replay', () => {
    render(<IncidentReplay replay={makeReplay()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))
    fireEvent.click(screen.getByRole('button', { name: /skip to end/i }))

    fireEvent.click(screen.getByRole('button', { name: /replay/i }))
    expect(stepStates()).toEqual(['active', 'pending', 'pending'])

    advance(1000)
    expect(stepStates()).toEqual(['done', 'active', 'pending'])
  })

  it('reveals everything immediately under prefers-reduced-motion, with no timers', () => {
    mockMatchMedia(true)
    render(<IncidentReplay replay={makeReplay()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))

    expect(stepStates()).toEqual(['done', 'done', 'done'])
    // The reduced-motion contract is "no pacing at all" — the assertion the
    // component is held to is that it schedules nothing.
    expect(vi.getTimerCount()).toBe(0)
    expect(screen.queryByRole('button', { name: /pause/i })).not.toBeInTheDocument()
    expect(screen.getByTestId('replay-conclusion')).toHaveAttribute('data-state', 'done')
  })

  it('clears its timer on unmount', () => {
    const { unmount } = render(<IncidentReplay replay={makeReplay()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))
    expect(vi.getTimerCount()).toBeGreaterThan(0)

    unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('marks the in-flight step as thinking, for decoration only', () => {
    render(<IncidentReplay replay={makeReplay()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Run the investigation' }))

    const indicator = screen.getByTestId('replay-thinking')
    expect(indicator).toHaveAttribute('aria-hidden', 'true')

    fireEvent.click(screen.getByRole('button', { name: /skip to end/i }))
    expect(screen.queryByTestId('replay-thinking')).not.toBeInTheDocument()
  })

  it('announces politely rather than assertively', () => {
    render(<IncidentReplay replay={makeReplay()} />)
    const list = screen.getByRole('list', { name: /investigation/i })
    expect(list).toHaveAttribute('aria-live', 'polite')
    expect(list.tagName).toBe('OL')
  })
})
