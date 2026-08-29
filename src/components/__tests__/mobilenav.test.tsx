import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MobileNav from '../MobileNav'
import type { Settings } from '@/content'

const base: Settings = {
  name: 'Pranav Patil',
  roles: ['Engineer'],
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

const sections = [
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Case studies' },
]

function trigger() {
  return screen.getByRole('button', { name: /menu/i })
}

function open() {
  fireEvent.click(trigger())
}

describe('MobileNav', () => {
  it('renders only a trigger until opened', () => {
    render(<MobileNav sections={sections} settings={base} />)

    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
    expect(trigger()).toHaveAttribute('aria-controls')
  })

  it('opens an accessible modal dialog and reflects state on the trigger', () => {
    render(<MobileNav sections={sections} settings={base} />)
    open()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName()
    expect(trigger()).toHaveAttribute('aria-expanded', 'true')
    expect(trigger()).toHaveAttribute('aria-controls', dialog.id)
  })

  it('lists the in-page sections plus the site-wide destinations', () => {
    render(<MobileNav sections={sections} settings={{ ...base, resumePdf: '/cv.pdf' }} />)
    open()

    expect(screen.getByRole('link', { name: 'Experience' })).toHaveAttribute(
      'href',
      '#experience',
    )
    expect(screen.getByRole('link', { name: 'Case studies' })).toHaveAttribute(
      'href',
      '#projects',
    )
    expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/work')
    expect(screen.getByRole('link', { name: 'Writing' })).toHaveAttribute('href', '/articles')
    expect(screen.getByRole('link', { name: /résumé/i })).toHaveAttribute('href', '/cv.pdf')
    expect(screen.getByRole('link', { name: /email/i })).toHaveAttribute(
      'href',
      'mailto:hello@example.com',
    )
  })

  it('omits the résumé entry when no résumé is published, keeping email', () => {
    render(<MobileNav sections={sections} settings={base} />)
    open()

    expect(screen.queryByRole('link', { name: /résumé/i })).toBeNull()
    expect(screen.getByRole('link', { name: /email/i })).toBeInTheDocument()
  })

  it('works with no in-page sections — the case sub-pages mount', () => {
    render(<MobileNav sections={[]} settings={base} />)
    open()

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /on this page/i })).toBeNull()
    expect(screen.getByRole('link', { name: 'Work' })).toBeInTheDocument()
  })

  it('closes on Escape', () => {
    render(<MobileNav sections={sections} settings={base} />)
    open()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(trigger()).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes on a backdrop press', () => {
    render(<MobileNav sections={sections} settings={base} />)
    open()

    fireEvent.click(screen.getByTestId('mobile-nav-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes when a link is clicked', () => {
    render(<MobileNav sections={sections} settings={base} />)
    open()

    fireEvent.click(screen.getByRole('link', { name: 'Experience' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('moves focus into the panel on open and back to the trigger on close', () => {
    render(<MobileNav sections={sections} settings={base} />)
    const button = trigger()
    button.focus()

    open()
    const dialog = screen.getByRole('dialog')
    expect(dialog.contains(document.activeElement)).toBe(true)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger())
  })

  it('traps Tab inside the panel', () => {
    render(
      <>
        <button type="button">outside</button>
        <MobileNav sections={sections} settings={base} />
      </>,
    )
    open()
    const dialog = screen.getByRole('dialog')

    // Assert the wrap itself — "focus is still inside" passes trivially, since
    // focus starts inside.
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button:not([disabled])'),
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    last.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })

  it('locks body scroll while open and restores the previous value', () => {
    document.body.style.overflow = 'scroll'
    render(<MobileNav sections={sections} settings={base} />)

    open()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.keyDown(window, { key: 'Escape' })
    // Restores what was there before, rather than blanking it.
    expect(document.body.style.overflow).toBe('scroll')
    document.body.style.overflow = ''
  })

  it('releases the body scroll lock if it unmounts while open', () => {
    const { unmount } = render(<MobileNav sections={sections} settings={base} />)
    open()
    expect(document.body.style.overflow).toBe('hidden')

    // A client-side route change unmounts the bar mid-transition; without
    // cleanup the page would stay unscrollable forever.
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})
