import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import ScrollProgress from '../ScrollProgress'

function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reduced && query.includes('reduce'),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

beforeEach(() => {
  vi.unstubAllGlobals()
  stubMatchMedia(false)
})

describe('ScrollProgress', () => {
  it('renders nothing on the server — the bar is a post-mount enhancement', () => {
    expect(renderToStaticMarkup(<ScrollProgress />)).toBe('')
  })

  it('renders nothing under prefers-reduced-motion', () => {
    stubMatchMedia(true)
    render(<ScrollProgress />)
    expect(screen.queryByTestId('scroll-progress')).toBeNull()
  })

  it('renders an accessible progress bar when motion is allowed', () => {
    render(<ScrollProgress />)
    const bar = screen.getByTestId('scroll-progress')
    expect(bar).toBeInTheDocument()
    expect(bar).toHaveAttribute('aria-hidden', 'true')
  })

  it('coalesces scroll events through requestAnimationFrame', () => {
    const raf = vi.fn().mockReturnValue(1)
    vi.stubGlobal('requestAnimationFrame', raf)
    vi.stubGlobal('cancelAnimationFrame', vi.fn())

    render(<ScrollProgress />)
    raf.mockClear()

    // Three scroll events in one frame must schedule exactly one measurement.
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('scroll'))
    expect(raf).toHaveBeenCalledTimes(1)
  })
})
