import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { Settings } from '@/content'

/**
 * The hero is the one section where "it looks right" and "it is readable"
 * genuinely diverge: GSAP drives the choreography, and a botched reveal leaves
 * the owner's name sitting at `opacity: 0` on a page that still scores fine on
 * every other check. These tests therefore assert two separate things — that
 * every string is present in the DOM, and that nothing is left invisible.
 */

// GSAP never runs for real here. jsdom has no layout, so a timeline would tween
// against zeroed metrics and tell us nothing; what matters is *whether* it was
// invoked, which a mock reports precisely.
const gsapCalls = {
  from: [] as unknown[][],
  to: [] as unknown[][],
  registerPlugin: [] as unknown[][],
  revert: 0,
}

vi.mock('gsap', () => {
  const context = (fn: () => void) => {
    fn()
    return {
      revert: () => {
        gsapCalls.revert += 1
      },
    }
  }
  const gsap = {
    registerPlugin: (...args: unknown[]) => {
      gsapCalls.registerPlugin.push(args)
    },
    context,
    from: (...args: unknown[]) => {
      gsapCalls.from.push(args)
      return {}
    },
    to: (...args: unknown[]) => {
      gsapCalls.to.push(args)
      return {}
    },
    set: () => ({}),
  }
  return { default: gsap, gsap }
})

vi.mock('gsap/ScrollTrigger', () => ({
  ScrollTrigger: { create: () => ({}), getAll: () => [], refresh: () => {} },
  default: { create: () => ({}) },
}))

// The particle portrait pulls in `three`; it has its own test file.

import Hero from '../Hero'

const BIO_ONE = 'Builds backend systems for payments and lending at scale.'
const BIO_TWO = 'Works mostly in Java, Kotlin and TypeScript.'

function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    name: 'Pranav Patil',
    roles: ['Software Engineer', 'Backend & Distributed Systems'],
    bio: `${BIO_ONE}\n\n${BIO_TWO}`,
    location: 'Gurugram, India',
    email: 'hello@example.com',
    resumePdf: '/uploads/resume.pdf',
    socials: [
      { label: 'GitHub', url: 'https://github.com/x', icon: 'github' },
      { label: 'LinkedIn', url: 'https://linkedin.com/in/x', icon: 'linkedin' },
    ],
    theme: {
      accent: '#ff6b1a',
      background: '#080808',
      foreground: '#f4f4f7',
      defaultMode: 'dark',
    },
    seo: { title: 't', description: 'd' },
    features: { hero3d: true, mediumImport: false },
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

/** Whitespace-insensitive read of everything the page actually says. */
function readableText(container: HTMLElement): string {
  return (container.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Every element that would render invisible, by class or by inline style.
 *
 * The inline half is the half that matters: GSAP writes `style="opacity:0"`,
 * never a class, so a class-only scan would pass vacuously against exactly the
 * bug this guards.
 */
function invisibleElements(container: HTMLElement): Element[] {
  return Array.from(container.querySelectorAll('*')).filter((el) => {
    const inline = (el as HTMLElement).style?.opacity
    if (inline !== undefined && inline !== '' && Number(inline) === 0) return true
    return /(^|\s|:)opacity-0(\s|$)/.test(el.className?.toString?.() ?? '')
  })
}

beforeEach(() => {
  gsapCalls.from.length = 0
  gsapCalls.to.length = 0
  gsapCalls.registerPlugin.length = 0
  gsapCalls.revert = 0
  mockMatchMedia(false)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('Hero — content is server-rendered DOM', () => {
  it('renders the name in the level-1 heading', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pranav Patil')
  })

  it('renders every role as its own node', () => {
    render(<Hero settings={makeSettings()} />)
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend & Distributed Systems')).toBeInTheDocument()
  })

  it('renders the full bio text', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    const text = readableText(container)
    expect(text).toContain(BIO_ONE)
    expect(text).toContain(BIO_TWO)
  })

  it('splits a blank-line-separated bio into separate paragraphs', () => {
    const { container } = render(<Hero settings={makeSettings()} />)
    const paragraphs = Array.from(container.querySelectorAll('[data-hero-bio]'))
    expect(paragraphs).toHaveLength(2)
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
})

describe('Hero — server HTML reads without JavaScript', () => {
  /**
   * The strictest form of the guarantee. `renderToString` runs no effects and
   * no GSAP, so this is exactly the markup a reader with JavaScript disabled —
   * or a crawler, or a print stylesheet — receives.
   */
  it('ships every string, and nothing hidden, in the server HTML', async () => {
    const { renderToString } = await import('react-dom/server')
    const html = renderToString(<Hero settings={makeSettings()} />)

    const text = html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ')
    expect(text).toContain('Pranav Patil')
    expect(text).toContain('Software Engineer')
    expect(text).toContain('Backend &amp; Distributed Systems')
    expect(text).toContain(BIO_ONE)
    expect(text).toContain(BIO_TWO)
    expect(text).toContain('Get in touch')
    expect(text).toContain('Explore')

    expect(html).not.toMatch(/opacity\s*:\s*0[;"]/)
    expect(html).not.toMatch(/class="[^"]*\bopacity-0\b/)
  })
})

describe('Hero — motion', () => {
  it('runs the GSAP reveal when motion is allowed', () => {
    render(<Hero settings={makeSettings()} />)
    expect(gsapCalls.from.length).toBeGreaterThan(0)
  })

  it('skips GSAP entirely under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    render(<Hero settings={makeSettings()} />)
    expect(gsapCalls.from).toHaveLength(0)
    expect(gsapCalls.to).toHaveLength(0)
  })

  it('leaves nothing invisible under prefers-reduced-motion', () => {
    mockMatchMedia(true)
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(invisibleElements(container)).toHaveLength(0)
  })

  it('leaves nothing invisible when motion is allowed', () => {
    // The markup's resting state is fully visible; GSAP animates *from* hidden.
    // So even with the timeline stubbed out, every string is readable.
    const { container } = render(<Hero settings={makeSettings()} />)
    expect(invisibleElements(container)).toHaveLength(0)
  })

  it('renders the bio readably once BlurText can reveal it', () => {
    // jsdom has no IntersectionObserver, so the component's plain fallback is
    // what the other tests exercise. Supplying one takes the enhanced path and
    // proves the text survives the swap rather than vanishing into it.
    class FakeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() {
        return []
      }
      root = null
      rootMargin = ''
      thresholds = []
    }
    vi.stubGlobal('IntersectionObserver', FakeObserver)

    const { container } = render(<Hero settings={makeSettings()} />)
    expect(readableText(container)).toContain(BIO_ONE)

    vi.unstubAllGlobals()
  })

  it('reverts its GSAP context on unmount so no inline opacity survives', () => {
    const { unmount } = render(<Hero settings={makeSettings()} />)
    unmount()
    expect(gsapCalls.revert).toBeGreaterThan(0)
  })
})
