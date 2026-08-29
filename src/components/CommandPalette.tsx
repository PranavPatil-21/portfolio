'use client'

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

export type CommandItem = {
  id: string
  label: string
  group: string
  href: string
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])'

/**
 * Forgiving match: an exact substring wins, otherwise the query has to appear
 * as an ordered subsequence of the label. That covers the two things people
 * actually do — type a fragment ("ledg") or skip letters ("lgr") — without
 * pulling in a fuzzy-search dependency whose scoring nobody can explain. Rank
 * substring hits above subsequence hits so the obvious answer stays first.
 */
function score(label: string, query: string): number | null {
  if (!query) return 0
  const l = label.toLowerCase()
  const q = query.toLowerCase()

  const direct = l.indexOf(q)
  if (direct !== -1) return direct

  let cursor = 0
  for (const char of q) {
    const found = l.indexOf(char, cursor)
    if (found === -1) return null
    cursor = found + 1
  }
  return 1000 + cursor
}

/**
 * ⌘K launcher.
 *
 * Focus behaviour, which is the whole reason a palette feels native or doesn't:
 *
 * - The element that was focused when the palette opened is captured in a ref
 *   and re-focused on close, but only if it is still in the document.
 * - While open, focus is trapped: a `Tab`/`Shift-Tab` handler on the dialog
 *   collects focusables *from the dialog subtree only* and wraps the cycle by
 *   hand. The discoverability chip is a sibling of the dialog, never an
 *   ancestor, so it can't be tabbed to from inside.
 * - Focus never leaves the input. Row selection is communicated with
 *   `aria-activedescendant` instead of by moving DOM focus, so the arrow keys
 *   and the text caret don't fight each other.
 *
 * Rows are real anchors, so cmd-click and middle-click open in a new tab for
 * free; Enter just synthesises a click on the selected one.
 */
export function CommandPalette({ items }: { items: CommandItem[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(0)
  // Assume touch until the browser tells us otherwise: a keyboard hint shown to
  // someone with no keyboard is worse than a button shown to someone with one.
  const [fine, setFine] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const restoreRef = useRef<HTMLElement | null>(null)

  const baseId = useId()
  const listId = `${baseId}-list`
  const titleId = `${baseId}-title`
  const optionId = (index: number) => `${baseId}-option-${index}`

  useEffect(() => {
    setFine(Boolean(window.matchMedia?.('(pointer: fine)').matches))
  }, [])

  const results = useMemo(() => {
    const scored = items
      .map((item) => ({ item, rank: score(item.label, query) }))
      .filter((entry): entry is { item: CommandItem; rank: number } => entry.rank !== null)
      .sort((a, b) => a.rank - b.rank)
      .map((entry) => entry.item)

    // Stable group order, driven by first appearance in `items` so the caller
    // controls it rather than alphabetical accident.
    const order = [...new Set(items.map((i) => i.group))]
    const groups = order
      .map((group) => ({ group, entries: scored.filter((i) => i.group === group) }))
      .filter((g) => g.entries.length > 0)

    const flat = groups.flatMap((g) => g.entries)
    return { groups, flat }
  }, [items, query])

  const requestOpen = useCallback(() => {
    restoreRef.current = document.activeElement as HTMLElement | null
    setQuery('')
    setSelected(0)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
    const previous = restoreRef.current
    restoreRef.current = null
    if (previous && document.contains(previous)) previous.focus()
  }, [])

  // Global hotkey. `preventDefault` matters — Ctrl-K is a browser binding.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        if (open) close()
        else requestOpen()
        return
      }
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close, requestOpen])

  // Move focus in, and lock the background from scrolling behind the overlay.
  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  // Keep the selected row visible as the arrows walk past the viewport edge.
  useEffect(() => {
    if (!open) return
    const node = listRef.current?.querySelector(`#${CSS.escape(optionId(selected))}`)
    // `block: 'nearest'` scrolls the list, not the whole page.
    ;(node as HTMLElement | null)?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, open, query])

  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    // Query the dialog subtree only. `offsetParent` is deliberately not used to
    // filter here: children of a `position: fixed` ancestor report a null
    // offsetParent in real browsers, which would empty the cycle entirely.
    const focusables = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [],
    )
    if (focusables.length === 0) return

    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    const index = focusables.indexOf(document.activeElement as HTMLElement)

    event.preventDefault()
    if (index === -1) {
      // Focus was outside the dialog entirely (a stray programmatic focus).
      // Re-enter at the edge the user was heading towards.
      ;(event.shiftKey ? last : first).focus()
      return
    }
    if (event.shiftKey) {
      ;(index === 0 ? last : focusables[index - 1]).focus()
    } else {
      ;(index === focusables.length - 1 ? first : focusables[index + 1]).focus()
    }
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const count = results.flat.length
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (count) setSelected((i) => (i + 1) % count)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (count) setSelected((i) => (i - 1 + count) % count)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const node = listRef.current?.querySelector<HTMLAnchorElement>(
        `#${CSS.escape(optionId(selected))}`,
      )
      if (node) {
        node.click()
        close()
      }
    }
  }

  const chip = fine ? (
    <span
      data-testid="command-palette-chip"
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-2 py-1 font-mono text-[11px] text-[var(--subtle)]"
    >
      <span className="tracking-wide">⌘K</span>
      <span className="hidden sm:inline">to search</span>
    </span>
  ) : (
    <button
      type="button"
      data-testid="command-palette-chip"
      onClick={requestOpen}
      className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--subtle)]"
    >
      Search
    </button>
  )

  let flatIndex = -1

  return (
    <>
      {/*
        Anchored bottom-right rather than left in page flow. Rendered inline it
        landed as a stray strip across the top of the document, above the
        header, which read as a rendering fault rather than an affordance.
      */}
      <div className="pointer-events-auto fixed right-5 bottom-5 z-40 hidden sm:block">{chip}</div>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
          <div
            data-testid="command-palette-backdrop"
            onClick={close}
            className="absolute inset-0 bg-[color-mix(in_oklab,var(--background)_80%,transparent)] backdrop-blur-sm"
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={onDialogKeyDown}
            className="relative w-full max-w-lg overflow-hidden rounded-xl border border-[var(--hairline)] bg-[var(--background)] shadow-2xl"
          >
            <h2 id={titleId} className="sr-only">
              Search this site
            </h2>
            <div className="border-b border-[var(--hairline)] px-4">
              <input
                ref={inputRef}
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={
                  results.flat.length ? optionId(selected) : undefined
                }
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelected(0)
                }}
                onKeyDown={onInputKeyDown}
                placeholder="Jump to a section, case study or link…"
                className="w-full bg-transparent py-3.5 text-[15px] text-[var(--foreground)] outline-none placeholder:text-[var(--subtle)]"
              />
            </div>

            <div ref={listRef} id={listId} role="listbox" aria-labelledby={titleId} className="max-h-[46vh] overflow-y-auto p-2">
              {results.groups.map((group) => (
                <div key={group.group} className="mb-1">
                  <div className="eyebrow px-2 py-1.5">{group.group}</div>
                  {group.entries.map((item) => {
                    flatIndex += 1
                    const index = flatIndex
                    const active = index === selected
                    return (
                      <a
                        key={item.id}
                        id={optionId(index)}
                        role="option"
                        aria-selected={active}
                        href={item.href}
                        onMouseMove={() => setSelected(index)}
                        onClick={close}
                        className={`flex items-center justify-between gap-3 rounded-lg px-2 py-2 text-sm no-underline ${
                          active
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-readable)]'
                            : 'text-[var(--muted)]'
                        }`}
                      >
                        <span>{item.label}</span>
                        <span aria-hidden="true" className="font-mono text-[11px] text-[var(--subtle)]">
                          ↵
                        </span>
                      </a>
                    )
                  })}
                </div>
              ))}

              {results.flat.length === 0 && (
                <p
                  data-testid="command-palette-empty"
                  className="px-2 py-6 text-center text-sm text-[var(--subtle)]"
                >
                  No matches for “{query}”. Try a project name or a section.
                </p>
              )}
            </div>

            <div className="flex items-center gap-4 border-t border-[var(--hairline)] px-4 py-2 font-mono text-[10px] text-[var(--subtle)]">
              <span>↑↓ navigate</span>
              <span>↵ open</span>
              <span>esc close</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default CommandPalette
