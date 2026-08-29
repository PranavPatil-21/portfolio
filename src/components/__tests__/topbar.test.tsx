import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import TopBar from '../TopBar'
import type { Settings } from '@/content'

const base: Settings = {
  name: 'Pranav Patil',
  roles: ['Engineer'],
  headline: 'Builds *systems*.',
  bio: 'A short bio.',
  location: 'Dubai',
  email: 'hello@example.com',
  socials: [],
  theme: {
    accent: '#ff6a00',
    background: '#0b0b0b',
    foreground: '#f5f5f5',
    defaultMode: 'dark',
  },
  seo: { title: 'Pranav Patil', description: 'Portfolio' },
  features: { hero3d: true, mediumImport: false },
} as unknown as Settings

/** Drives the real `scroll` listener the bar attaches to `window`. */
function scrollTo(y: number) {
  act(() => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true, writable: true })
    fireEvent.scroll(window)
  })
}

afterEach(() => {
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true })
})

describe('TopBar', () => {
  it('renders the résumé button when resumePdf is set', () => {
    render(<TopBar settings={{ ...base, resumePdf: '/cv.pdf' }} />)

    const resume = screen.getByRole('link', { name: /résumé/i })
    expect(resume).toHaveAttribute('href', '/cv.pdf')
    // The résumé supersedes the email fallback — never both.
    expect(screen.queryByRole('link', { name: /email/i })).toBeNull()
  })

  it('falls back to an email link when resumePdf is absent', () => {
    render(<TopBar settings={base} />)

    expect(screen.queryByRole('link', { name: /résumé/i })).toBeNull()
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
  })

  it('treats a blank resumePdf as unset', () => {
    render(<TopBar settings={{ ...base, resumePdf: '   ' }} />)

    expect(screen.queryByRole('link', { name: /résumé/i })).toBeNull()
    expect(screen.getByRole('link', { name: /email/i })).toBeInTheDocument()
  })

  it('links work and writing to their routes', () => {
    render(<TopBar settings={base} />)

    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/work')
    expect(screen.getByRole('link', { name: 'Writing' })).toHaveAttribute('href', '/articles')
  })

  it('links the name to / in the sub variant', () => {
    render(<TopBar settings={base} variant="sub" />)

    expect(screen.getByRole('link', { name: base.name })).toHaveAttribute('href', '/')
  })

  it('is opaque from the start in the sub variant', () => {
    render(<TopBar settings={base} variant="sub" />)

    expect(screen.getByRole('banner')).toHaveAttribute('data-variant', 'sub')
  })

  it('flips data-scrolled past the threshold and back', () => {
    render(<TopBar settings={base} />)
    const bar = screen.getByRole('banner')

    expect(bar).toHaveAttribute('data-scrolled', 'false')

    scrollTo(80)
    expect(bar).toHaveAttribute('data-scrolled', 'true')

    scrollTo(0)
    expect(bar).toHaveAttribute('data-scrolled', 'false')
  })

  it('reads the scroll position on mount, not only on the next scroll event', () => {
    Object.defineProperty(window, 'scrollY', { value: 400, configurable: true, writable: true })
    render(<TopBar settings={base} />)

    // Deep-linked arrivals (#anchor, browser scroll restoration) fire no scroll
    // event, so a listener-only implementation would paint a transparent bar
    // over content.
    expect(screen.getByRole('banner')).toHaveAttribute('data-scrolled', 'true')
  })

  it('renders the mobile menu trigger only when sections are supplied', () => {
    const { unmount } = render(<TopBar settings={base} />)
    expect(screen.queryByRole('button', { name: /menu/i })).toBeNull()
    unmount()

    render(<TopBar settings={base} sections={[{ id: 'work', label: 'Work' }]} />)
    expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
  })

  it('does not duplicate the skip link owned by the layout', () => {
    render(<TopBar settings={base} />)
    expect(screen.queryByRole('link', { name: /skip to content/i })).toBeNull()
  })
})
