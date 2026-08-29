import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import type { LayoutEntry, Settings } from '@/content'
import Nav from '../Nav'
import Footer from '../Footer'
import Grain from '../Grain'
import Cursor from '../Cursor'

/**
 * jsdom ships no `matchMedia`. Every component under test asks it a different
 * question — reduced motion, `(pointer: fine)`, `(pointer: coarse)` — so the
 * stub has to answer *per query* rather than return one blanket boolean. A stub
 * that only looks for "reduce" silently reports "fine pointer" for the coarse
 * case and the touch-guard assertion below would pass against a broken guard.
 */
function stubMatchMedia({
  reduced = false,
  pointer = 'fine',
}: { reduced?: boolean; pointer?: 'fine' | 'coarse' | 'none' } = {}) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => {
      let matches = false
      if (query.includes('prefers-reduced-motion')) matches = reduced
      else if (query.includes('pointer: fine')) matches = pointer === 'fine'
      else if (query.includes('pointer: coarse')) matches = pointer === 'coarse'

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
    }),
  )
}

const settings = {
  name: 'Pranav Patil',
  roles: ['Software Engineer'],
  bio: 'Builds things.',
  location: 'Dubai',
  email: 'hello@example.com',
  socials: [
    { label: 'GitHub', url: 'https://github.com/pranav', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/pranav', icon: 'linkedin' },
  ],
  theme: {
    accent: '#ff6b1a',
    background: '#080808',
    foreground: '#ffffff',
    defaultMode: 'dark',
  },
  seo: { title: 'Pranav Patil', description: 'Portfolio' },
  features: { hero3d: true, mediumImport: false },
} as unknown as Settings

const layout: LayoutEntry[] = [
  { sectionId: 'hero', visible: true },
  { sectionId: 'experience', visible: true },
  { sectionId: 'projects', visible: false },
  { sectionId: 'skills', visible: true },
  { sectionId: 'photography', visible: true },
  { sectionId: 'unknown-section', visible: true },
]

const customTitles = new Map<string, string>([['photography', 'Photography']])

function renderNav() {
  return render(<Nav layout={layout} settings={settings} customTitles={customTitles} />)
}

beforeEach(() => {
  stubMatchMedia()
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.body.style.overflow = ''
  document.documentElement.className = ''
})

describe('Nav', () => {
  it('renders one desktop link per visible, labelled, non-hero layout entry', () => {
    renderNav()
    const primary = screen.getByRole('navigation', { name: /primary/i })

    expect(within(primary).getByRole('link', { name: 'Experience' })).toBeInTheDocument()
    expect(within(primary).getByRole('link', { name: 'Skills' })).toBeInTheDocument()
    // Not in LABELS, but the CMS gave it a title — that title is the label.
    expect(within(primary).getByRole('link', { name: 'Photography' })).toBeInTheDocument()
  })

  it('skips hidden sections, hero, and sections with no resolvable label', () => {
    renderNav()
    expect(screen.queryByRole('link', { name: 'Projects' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /unknown-section/i })).not.toBeInTheDocument()
    // `hero` is the top of the page, not a destination.
    expect(
      screen.queryAllByRole('link').filter((a) => a.getAttribute('href') === '#hero').length,
    ).toBeLessThanOrEqual(1) // the wordmark only
  })

  it('links the owner name back to the top of the page', () => {
    renderNav()
    expect(screen.getByRole('link', { name: /pranav patil/i })).toHaveAttribute('href', '#hero')
  })

  it('opens the mobile menu, locks body scroll, and closes again on toggle', () => {
    renderNav()
    const toggle = screen.getByRole('button', { name: /menu/i })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('navigation', { name: /mobile/i })).toBeInTheDocument()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes the mobile menu when a link inside it is clicked', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))

    const overlay = screen.getByRole('navigation', { name: /mobile/i })
    fireEvent.click(within(overlay).getByRole('link', { name: 'Experience' }))

    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('closes the mobile menu on Escape', () => {
    renderNav()
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    expect(screen.getByRole('navigation', { name: /mobile/i })).toBeInTheDocument()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /menu/i })).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Cursor', () => {
  it('renders a dot and a ring on a fine-pointer device with motion allowed', () => {
    stubMatchMedia({ reduced: false, pointer: 'fine' })
    const { container } = render(<Cursor />)

    expect(container.querySelector('[data-testid="cursor-dot"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="cursor-ring"]')).toBeInTheDocument()
  })

  it('renders nothing on a coarse-pointer (touch) device and never hides the native cursor', () => {
    stubMatchMedia({ reduced: false, pointer: 'coarse' })
    const { container } = render(<Cursor />)

    expect(container).toBeEmptyDOMElement()
    expect(document.documentElement.className).not.toContain('cursor-none')
  })

  it('renders nothing when reduced motion is preferred', () => {
    stubMatchMedia({ reduced: true, pointer: 'fine' })
    const { container } = render(<Cursor />)

    expect(container).toBeEmptyDOMElement()
    expect(document.documentElement.className).not.toContain('cursor-none')
  })

  it('never leaves the native cursor hidden after unmount', () => {
    stubMatchMedia({ reduced: false, pointer: 'fine' })
    const { unmount } = render(<Cursor />)

    expect(document.documentElement.className).toContain('cursor-none')
    expect(document.head.innerHTML).toContain('cursor: none')

    unmount()

    // Both halves must go. The class alone is inert, but a `cursor: none` rule
    // left behind in <head> would hide the pointer on a page that no longer
    // draws a replacement — the exact failure this component must not cause.
    expect(document.documentElement.className).not.toContain('cursor-none')
    expect(document.head.innerHTML).not.toContain('cursor: none')
  })

  it('does not inject the cursor-hiding rule at all on a touch device', () => {
    stubMatchMedia({ reduced: false, pointer: 'coarse' })
    render(<Cursor />)

    expect(document.head.innerHTML).not.toContain('cursor: none')
  })
})

describe('Grain', () => {
  it('renders a decorative overlay hidden from assistive technology', () => {
    const { container } = render(<Grain />)
    const overlay = container.querySelector('.grain-overlay')

    expect(overlay).toBeInTheDocument()
    expect(overlay).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Footer', () => {
  it('renders the email as a mailto link, the socials, and a copyright line', () => {
    render(<Footer settings={settings} />)

    expect(screen.getByRole('link', { name: /hello@example\.com/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/pranav',
    )
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'rel',
      'noreferrer noopener',
    )
    expect(
      screen.getByText(new RegExp(`${new Date().getFullYear()}`)),
    ).toBeInTheDocument()
  })
})
