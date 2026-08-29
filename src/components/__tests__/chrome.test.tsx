import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react'
import type { LayoutEntry, Settings } from '@/content'
import Nav from '../Nav'
import Footer from '../Footer'

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

function renderNav(overrides: Partial<Settings> = {}) {
  return render(
    <Nav
      layout={layout}
      settings={{ ...settings, ...overrides } as Settings}
      customTitles={customTitles}
    />,
  )
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

/**
 * The bar carries the one thing a recruiter is looking for. These pin that it
 * is always present, that it prefers the résumé over the mailto, and that its
 * accessible name never collides with the wordmark — `getByRole` throws on a
 * duplicate match, so a CTA named after the owner would silently take the
 * "links the owner name back to the top" assertion above down with it.
 */
describe('Nav call to action', () => {
  it('renders a résumé download when resumePdf is set', () => {
    renderNav({ resumePdf: '/uploads/resume.pdf' })
    const primary = screen.getByRole('navigation', { name: /primary/i })

    const cta = within(primary).getByRole('link', { name: /resume/i })
    expect(cta).toHaveAttribute('href', '/uploads/resume.pdf')
    expect(cta).toHaveAttribute('download')
  })

  it('falls back to a mailto CTA when there is no résumé', () => {
    renderNav()
    const primary = screen.getByRole('navigation', { name: /primary/i })

    expect(within(primary).getByRole('link', { name: /email me/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
    expect(within(primary).queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('does not name the CTA after the owner, so the wordmark stays unambiguous', () => {
    renderNav({ resumePdf: '/uploads/resume.pdf' })
    // Throws if the CTA also matched — which is the failure this guards.
    expect(screen.getByRole('link', { name: /pranav patil/i })).toHaveAttribute('href', '#hero')
  })

  it('repeats the CTA inside the mobile menu and closes the menu on click', () => {
    renderNav({ resumePdf: '/uploads/resume.pdf' })
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))

    const overlay = screen.getByRole('navigation', { name: /mobile/i })
    const cta = within(overlay).getByRole('link', { name: /resume/i })
    expect(cta).toHaveAttribute('href', '/uploads/resume.pdf')

    fireEvent.click(cta)
    expect(screen.queryByRole('navigation', { name: /mobile/i })).not.toBeInTheDocument()
  })
})

describe('Nav scroll state', () => {
  it('starts transparent and becomes opaque once the page has scrolled', () => {
    const { container } = renderNav()
    const header = container.querySelector('header')

    expect(header).toHaveAttribute('data-scrolled', 'false')

    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true })
    fireEvent.scroll(window)

    expect(header).toHaveAttribute('data-scrolled', 'true')
    expect(header?.className).toContain('bg-[var(--background)]')

    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true })
    fireEvent.scroll(window)
    expect(header).toHaveAttribute('data-scrolled', 'false')
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

  it('signs off with the owner name and does not repeat it as a link', () => {
    render(<Footer settings={settings} />)
    expect(screen.getAllByText(/pranav patil/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /^pranav patil$/i })).not.toBeInTheDocument()
  })

  it('renders no social list when socials is empty, keeping the email', () => {
    render(<Footer settings={{ ...settings, socials: [] } as Settings} />)
    expect(screen.queryByRole('link', { name: 'GitHub' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /hello@example\.com/i })).toBeInTheDocument()
  })
})
