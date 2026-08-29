import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Settings } from '@/content'

import Hero, { parseEmphasis } from '../Hero'

/**
 * The hero carries the thirty seconds a hiring manager actually spends here.
 * Two things therefore have to hold unconditionally: every load-bearing string
 * is in the *server-rendered* DOM, and none of it is sitting at `opacity: 0`
 * waiting for an animation that may never run.
 *
 * There is no canvas and no GSAP any more, so there is nothing to mock beyond
 * `matchMedia` — which jsdom does not implement, and which `Magnetic` probes.
 */

const BIO_ONE =
  "I'm a software engineer at Wio Bank, where I build the lending and payments systems behind Retail and SME credit products."
const BIO_TWO = "I'm moving toward product roles where AI is the product, not the garnish."

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    name: 'Pranav Patil',
    roles: ['Software Engineer, moving toward Product', 'AI & Multi-Agent Systems'],
    headline: HEADLINE,
    bio: `${BIO_ONE}\n\n${BIO_TWO}`,
    location: 'Gurugram, India',
    email: 'hello@example.com',
    resumePdf: '/uploads/resume.pdf',
    socials: [
      { label: 'GitHub', url: 'https://github.com/x', icon: 'github' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/x', icon: 'linkedin' },
    ],
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

/** Whitespace-insensitive read of everything the section actually says. */
const HEADLINE =
  'I build the *lending systems* behind Retail and SME credit at Wio Bank — moving toward *product roles where AI is the product*.'
const HEADLINE_PLAIN = HEADLINE.replace(/\*/g, '')

function readableText(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Every element that would render invisible, by class or by inline style.
 *
 * The inline half is the half that matters: a motion library writes
 * `style="opacity:0"`, never a class, so a class-only scan would pass
 * vacuously against exactly the bug this guards.
 */
function invisibleElements(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('*')).filter((el) => {
    const inline = (el as HTMLElement).style?.opacity
    if (inline !== undefined && inline !== '' && Number(inline) === 0) return true
    return /(^|\s|:)opacity-0(\s|$)/.test(el.className?.toString?.() ?? '')
  })
}

beforeEach(() => {
  mockMatchMedia(false)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Hero — the thirty-second read', () => {
  it('renders the name in the level-1 heading', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pranav Patil')
  })

  it('renders the positioning sentence as one contiguous line of text', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(readableText(container)).toContain(HEADLINE_PLAIN)
  })

  it('states the current employer and the direction of travel', () => {
    // Scoped to the positioning element specifically. Asserting against the
    // whole section would pass vacuously — the bio mentions both phrases too,
    // so a hero that rendered *only* the bio would look correct here.
    const { container } = render(<Hero settings={makeSettings()} />)
    const positioning = container.querySelector('[data-positioning]')
    expect(positioning).not.toBeNull()
    const text = readableText(positioning as HTMLElement)
    expect(text).toContain('Wio Bank')
    expect(text).toContain('product roles where AI is the product')
    expect(text).not.toContain('*')
  })

  it('renders the full bio text', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    const text = readableText(container)
    expect(text).toContain(BIO_ONE)
    expect(text).toContain(BIO_TWO)
  })

  it('splits a blank-line-separated bio into separate paragraphs', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(container.querySelectorAll('[data-hero-bio]')).toHaveLength(2)
  })

  it('renders a single-paragraph bio as one paragraph', () => {
    const { container } = render(<Hero settings={makeSettings({ bio: BIO_ONE })} />)
    expect(container.querySelectorAll('[data-hero-bio]')).toHaveLength(1)
  })

  it('renders the location in the eyebrow', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(readableText(container)).toContain('Gurugram, India')
  })

  it('keeps the section id', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(container.querySelector('section#hero')).not.toBeNull()
  })
})

describe('Hero — calls to action', () => {
  it('renders the mailto link', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByRole('link', { name: /get in touch/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
  })

  it('renders the résumé link when resumePdf is set', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByRole('link', { name: /r(é|e)sum(é|e)/i })).toHaveAttribute(
      'href',
      '/uploads/resume.pdf',
    )
  })

  it('hides the résumé link when resumePdf is absent', () => {
    render(<Hero settings={makeSettings({ resumePdf: undefined })} />)
    expect(screen.queryByRole('link', { name: /r(é|e)sum(é|e)/i })).not.toBeInTheDocument()
  })

  it('hides the résumé link when resumePdf is an empty string', () => {
    // The CMS clears a text field to `''`, not to nothing — "set" has to mean
    // non-empty or clearing the field publishes a link to the site root.
    render(<Hero settings={makeSettings({ resumePdf: '' })} />)
    expect(screen.queryByRole('link', { name: /r(é|e)sum(é|e)/i })).not.toBeInTheDocument()
  })

  it('hides the résumé link when resumePdf is only whitespace', () => {
    render(<Hero settings={makeSettings({ resumePdf: '  ' })} />)
    expect(screen.queryByRole('link', { name: /r(é|e)sum(é|e)/i })).not.toBeInTheDocument()
  })

  it('renders every social link', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/x',
    )
    expect(screen.getByRole('link', { name: /linkedin/i })).toHaveAttribute(
      'href',
      'https://linkedin.com/in/x',
    )
  })

  it('renders no social links when there are none', () => {
    render(<Hero settings={makeSettings({ socials: [] })} />)
    expect(screen.queryByRole('link', { name: /github/i })).not.toBeInTheDocument()
  })
})

describe('Hero — server HTML reads without JavaScript', () => {
  /**
   * The strictest form of the guarantee. `renderToString` runs no effects, so
   * this is exactly the markup a reader with JavaScript disabled — or a
   * crawler, or a print stylesheet — receives.
   */
  it('ships every string, and nothing hidden, in the server HTML', async () => {
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(<Hero settings={makeSettings()} />)

    const text = html
      .replace(/<[^>]*>/g, '')
      .replace(/&#x27;/g, "'")
      .replace(/\s+/g, ' ')
    expect(text).toContain('Pranav Patil')
    expect(text).toContain('Wio Bank')
    expect(text).toContain(BIO_ONE)
    expect(text).toContain('Get in touch')

    expect(html).not.toMatch(/opacity\s*:\s*0[;"]/)
    expect(html).not.toMatch(/class="[^"]*\bopacity-0\b/)
  })
})

describe('Hero — motion', () => {
  it('renders in its final position under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(invisibleElements(container)).toHaveLength(0)
    expect(readableText(container)).toContain(HEADLINE_PLAIN)
  })

  it('renders in its final position when motion is allowed', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(invisibleElements(container)).toHaveLength(0)
  })
})

describe('parseEmphasis', () => {
  it('splits emphasised runs and excludes the markers', () => {
    expect(parseEmphasis('a *b* c')).toEqual([
      { text: 'a ', accent: false },
      { text: 'b', accent: true },
      { text: ' c', accent: false },
    ])
  })

  it('keeps an unpaired asterisk as literal text', () => {
    // A stray marker must not swallow the rest of the sentence.
    expect(parseEmphasis('rated 5* hotel')).toEqual([{ text: 'rated 5* hotel', accent: false }])
  })

  it('handles text with no emphasis at all', () => {
    expect(parseEmphasis('plain')).toEqual([{ text: 'plain', accent: false }])
  })
})
