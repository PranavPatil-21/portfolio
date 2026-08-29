import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { hasReducedMotionListener, prefersReducedMotion } from 'motion-dom'
import { SectionShell } from '../SectionShell'
import { Card } from '../Card'
import { Tag } from '../Tag'
import { Reveal } from '../Reveal'

/**
 * jsdom ships no `matchMedia`, and motion's `useReducedMotion` subscribes to the
 * returned MediaQueryList. A partial stub silently reports "no preference", so
 * both branches need the full surface for the assertions below to mean anything.
 */
function stubMatchMedia(reduced: boolean) {
  // motion reads the media query once and caches the answer in a module-level
  // singleton. Clear it so the stub below is what actually drives the hook.
  hasReducedMotionListener.current = false
  prefersReducedMotion.current = null

  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

beforeEach(() => {
  stubMatchMedia(false)
  if (!('IntersectionObserver' in globalThis)) {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn()
        unobserve = vi.fn()
        disconnect = vi.fn()
        takeRecords = vi.fn(() => [])
      },
    )
  }
})

afterEach(() => {
  // Vitest is not running with `globals: true`, so RTL's auto-cleanup is off.
  cleanup()
  vi.unstubAllGlobals()
})

describe('SectionShell', () => {
  it('renders an h2 carrying the title', () => {
    render(
      <SectionShell id="experience" title="Experience">
        <p>body</p>
      </SectionShell>,
    )
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Experience')
  })

  it('sets the id on the section element itself so anchors resolve', () => {
    const { container } = render(
      <SectionShell id="projects" title="Projects">
        <p>body</p>
      </SectionShell>,
    )
    const section = container.querySelector('section#projects')
    expect(section).not.toBeNull()
  })

  it('renders the subtitle when given and its children', () => {
    render(
      <SectionShell id="skills" title="Skills" subtitle="What I reach for">
        <p>tooling</p>
      </SectionShell>,
    )
    expect(screen.getByText('What I reach for')).toBeInTheDocument()
    expect(screen.getByText('tooling')).toBeInTheDocument()
  })
})

describe('Card', () => {
  it('renders children and merges the supplied className', () => {
    const { container } = render(<Card className="custom-x">inside</Card>)
    expect(screen.getByText('inside')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('custom-x')
  })
})

describe('Tag', () => {
  it('renders its label and merges the supplied className', () => {
    const { container } = render(<Tag className="custom-y">TypeScript</Tag>)
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(container.firstElementChild?.className).toContain('custom-y')
  })
})

describe('Reveal', () => {
  it('renders its children into the DOM (never hidden from crawlers)', () => {
    render(
      <Reveal>
        <p>readable by a crawler</p>
      </Reveal>,
    )
    expect(screen.getByText('readable by a crawler')).toBeInTheDocument()
  })

  it('renders children when reduced motion is preferred', () => {
    stubMatchMedia(true)
    render(
      <Reveal delay={0.2}>
        <p>still readable</p>
      </Reveal>,
    )
    expect(screen.getByText('still readable')).toBeInTheDocument()
  })

  it('applies no inline transform or opacity when reduced motion is preferred', () => {
    stubMatchMedia(true)
    render(
      <Reveal>
        <p>no motion</p>
      </Reveal>,
    )
    const wrapper = screen.getByTestId('reveal')
    const style = wrapper.getAttribute('style') ?? ''
    expect(style).not.toMatch(/transform/)
    expect(style).not.toMatch(/opacity/)
  })

  it('does apply motion styling when reduced motion is not preferred', () => {
    render(
      <Reveal>
        <p>animated</p>
      </Reveal>,
    )
    const style = screen.getByTestId('reveal').getAttribute('style') ?? ''
    expect(style).toMatch(/opacity|transform/)
  })
})
