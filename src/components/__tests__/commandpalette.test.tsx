import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import CommandPalette from '../CommandPalette'

const items = [
  { id: 'work', label: 'Selected work', group: 'Sections', href: '#work' },
  { id: 'about', label: 'About', group: 'Sections', href: '#about' },
  { id: 'ledger', label: 'Ledger rewrite', group: 'Case studies', href: '#ledger' },
  { id: 'github', label: 'GitHub', group: 'Links', href: 'https://example.com' },
]

/** jsdom ships no matchMedia; the chip reads `(pointer: fine)` through it. */
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

function open() {
  fireEvent.keyDown(window, { key: 'k', metaKey: true })
}

beforeEach(() => {
  vi.unstubAllGlobals()
  stubMatchMedia(true)
})

describe('CommandPalette', () => {
  it('renders no dialog until opened, and is SSR-safe', () => {
    const html = renderToStaticMarkup(<CommandPalette items={items} />)
    expect(html).not.toContain('role="dialog"')

    render(<CommandPalette items={items} />)
    expect(screen.queryByRole('dialog')).toBeNull()
    // The discoverability affordance is always visible.
    expect(screen.getByText(/⌘K/)).toBeInTheDocument()
  })

  it('opens on ⌘K and on Ctrl-K, and exposes an accessible modal dialog', () => {
    render(<CommandPalette items={items} />)
    open()

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('closes on Escape and on a backdrop click', () => {
    render(<CommandPalette items={items} />)

    open()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()

    open()
    fireEvent.click(screen.getByTestId('command-palette-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('moves focus into the input on open and restores it to the trigger on close', () => {
    render(
      <>
        <button type="button">outside trigger</button>
        <CommandPalette items={items} />
      </>,
    )
    const trigger = screen.getByRole('button', { name: 'outside trigger' })
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    open()
    expect(document.activeElement).toBe(screen.getByRole('combobox'))

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.activeElement).toBe(trigger)
  })

  it('traps Tab inside the dialog while open', () => {
    render(
      <>
        <button type="button">outside trigger</button>
        <CommandPalette items={items} />
      </>,
    )
    open()
    const dialog = screen.getByRole('dialog')

    // Assert the wrap specifically — "focus is still inside" would pass even if
    // the handler did nothing, because focus starts inside.
    const focusables = Array.from(
      dialog.querySelectorAll<HTMLElement>('a[href], button, input'),
    )
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    last.focus()
    fireEvent.keyDown(dialog, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)

    // Focus can never escape to the trigger sitting outside the dialog.
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('locks body scroll while open and restores it on close', () => {
    render(<CommandPalette items={items} />)
    open()
    expect(document.body.style.overflow).toBe('hidden')
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('groups items under headings', () => {
    render(<CommandPalette items={items} />)
    open()
    expect(screen.getByText('Sections')).toBeInTheDocument()
    expect(screen.getByText('Case studies')).toBeInTheDocument()
    expect(screen.getByText('Links')).toBeInTheDocument()
  })

  it('filters as you type, forgiving of gaps between characters', () => {
    render(<CommandPalette items={items} />)
    open()
    const input = screen.getByRole('combobox')

    fireEvent.change(input, { target: { value: 'ledger' } })
    expect(screen.getByRole('option', { name: /Ledger rewrite/ })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /About/ })).toBeNull()

    // Subsequence match: "lgr" is spread across "Ledger rewrite".
    fireEvent.change(input, { target: { value: 'lgr' } })
    expect(screen.getByRole('option', { name: /Ledger rewrite/ })).toBeInTheDocument()
  })

  it('renders an empty state when nothing matches', () => {
    render(<CommandPalette items={items} />)
    open()
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzzzqqq' } })
    expect(screen.queryAllByRole('option')).toHaveLength(0)
    expect(screen.getByTestId('command-palette-empty')).toBeInTheDocument()
  })

  it('moves the selection with the arrow keys via aria-activedescendant', () => {
    render(<CommandPalette items={items} />)
    open()
    const input = screen.getByRole('combobox')
    const options = screen.getAllByRole('option')

    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
    expect(options[0]).toHaveAttribute('aria-selected', 'true')

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id)
    expect(options[1]).toHaveAttribute('aria-selected', 'true')
    expect(options[0]).toHaveAttribute('aria-selected', 'false')

    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id)
  })

  it('activates the selected row on Enter and closes', () => {
    render(<CommandPalette items={items} />)
    open()
    const input = screen.getByRole('combobox')

    const clicked = vi.fn()
    screen.getByRole('option', { name: /About/ }).addEventListener('click', clicked)

    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(clicked).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('renders a tappable button instead of a keyboard hint on touch devices', () => {
    stubMatchMedia(false) // no `(pointer: fine)`
    render(<CommandPalette items={items} />)

    const chip = screen.getByTestId('command-palette-chip')
    expect(chip.tagName).toBe('BUTTON')
    fireEvent.click(chip)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
