import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Experience, Settings } from '@/content'

import CurrentRole from '../CurrentRole'

/**
 * The section that carries "emphasize my current experience". Its whole job is
 * that the bullets — the outcomes — are legible and complete, so the tests are
 * about content survival rather than layout.
 */

function makeRole(overrides: Partial<Experience> = {}): Experience {
  return {
    slug: 'wio-software-engineer',
    role: 'Software Engineer',
    company: 'Wio Bank PJSC',
    location: 'Gurugram, India',
    start: '2024-09',
    end: undefined,
    current: true,
    bullets: [
      'Built WioGenie, a multi-agent AI system, every answer *citation-backed*.',
      'Took monthly statement accuracy to *99%* across *100K+* statements.',
    ],
    tech: ['Java', 'Spring Boot', 'LangGraph'],
    logo: undefined,
    order: 1,
    body: '',
    ...overrides,
  } as Experience
}

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    name: 'Pranav Patil',
    roles: ['Software Engineer, moving toward Product'],
    bio: 'A bio.',
    location: 'Gurugram, India',
    email: 'hello@example.com',
    resumePdf: '/uploads/resume.pdf',
    socials: [],
    theme: {
      accent: '#5b8def',
      background: '#0b0c0e',
      foreground: '#f2f4f7',
      defaultMode: 'dark',
    },
    seo: { title: 't', description: 'd' },
    features: { hero3d: false, mediumImport: false },
    ...overrides,
  } as Settings
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

function readableText(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim()
}

beforeEach(() => {
  mockMatchMedia(false)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CurrentRole — the featured role', () => {
  it('renders the company', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(readableText(container)).toContain('Wio Bank PJSC')
  })

  it('renders the job title', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(readableText(container)).toContain('Software Engineer')
  })

  it('renders the date range, with an open end reading as Present', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(readableText(container)).toContain('Sep 2024 — Present')
  })

  it('formats a closed date range from both ends', () => {
    const { container } = render(
      <CurrentRole
        role={makeRole({ current: false, end: '2025-03' })}
        settings={makeSettings()}
      />,
    )
    expect(readableText(container)).toContain('Sep 2024 — Mar 2025')
  })

  it('renders a year-only start without inventing a month', () => {
    // `new Date('2024')` would drag this across a timezone boundary; the
    // formatter is string-based precisely so it cannot.
    const { container } = render(
      <CurrentRole role={makeRole({ start: '2024' })} settings={makeSettings()} />,
    )
    expect(readableText(container)).toContain('2024 — Present')
  })

  it('renders the location', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(readableText(container)).toContain('Gurugram, India')
  })

  it('renders every bullet', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    const text = readableText(container)
    expect(text).toContain('Built WioGenie, a multi-agent AI system, every answer citation-backed.')
    expect(text).toContain('Took monthly statement accuracy to 99% across 100K+ statements.')
    expect(container.querySelectorAll('[data-bullet]')).toHaveLength(2)
  })

  it('renders the tech stack', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    const text = readableText(container)
    expect(text).toContain('Java')
    expect(text).toContain('LangGraph')
  })

  it('keeps the section id', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(container.querySelector('section#current')).not.toBeNull()
  })

  it('links to the email from settings', () => {
    render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    const link = screen.getByRole('link', { name: /talk about this work/i })
    expect(link).toHaveAttribute('href', 'mailto:hello@example.com')
  })
})

describe('CurrentRole — absent role', () => {
  it('returns null when given no role', () => {
    const { container } = render(<CurrentRole role={null} settings={makeSettings()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('returns null when given undefined', () => {
    const { container } = render(<CurrentRole role={undefined} settings={makeSettings()} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders with no bullets without crashing', () => {
    const { container } = render(
      <CurrentRole role={makeRole({ bullets: [] })} settings={makeSettings()} />,
    )
    expect(readableText(container)).toContain('Wio Bank PJSC')
    expect(container.querySelectorAll('[data-bullet]')).toHaveLength(0)
  })
})

describe('CurrentRole — asterisk emphasis', () => {
  it('strips the asterisk markers from the rendered text', () => {
    const { container } = render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(readableText(container)).not.toContain('*')
  })

  it('renders the emphasised span in the accent colour', () => {
    render(<CurrentRole role={makeRole()} settings={makeSettings()} />)
    expect(screen.getByText('citation-backed')).toHaveClass('text-[var(--accent-readable)]')
    expect(screen.getByText('99%')).toHaveClass('text-[var(--accent-readable)]')
  })

  it('leaves unemphasised text unhighlighted', () => {
    render(
      <CurrentRole
        role={makeRole({ bullets: ['Plain outcome with no emphasis at all.'] })}
        settings={makeSettings()}
      />,
    )
    expect(screen.getByText(/Plain outcome/)).not.toHaveClass('text-[var(--accent-readable)]')
  })

  it('renders an unpaired asterisk as literal text rather than dropping the tail', () => {
    // A CMS author will eventually type one asterisk. Losing the rest of the
    // sentence to a greedy parse is a far worse outcome than a stray glyph.
    const { container } = render(
      <CurrentRole
        role={makeRole({ bullets: ['Cut latency *from 3s to 1s and held it there.'] })}
        settings={makeSettings()}
      />,
    )
    expect(readableText(container)).toContain('and held it there.')
  })
})
