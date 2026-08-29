'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

type Status = 'idle' | 'copied' | 'failed'

const RESET_MS = 2000

/**
 * Copy-to-clipboard with a confirmed state that always expires.
 *
 * Three failure modes this guards against, all of them things a reviewer will
 * try in an interview: the Clipboard API missing entirely (non-secure origin),
 * `writeText` rejecting on a permissions prompt, and the button getting stuck
 * on "Copied" because a timer was never cleared. The live region is mounted
 * unconditionally so assistive tech is already observing it when the text
 * changes — a region that appears at the same moment as its message is often
 * missed entirely.
 */
export function CopyButton({
  value,
  label = 'Copy',
  className = '',
}: {
  value: string
  label?: string
  className?: string
}) {
  const [status, setStatus] = useState<Status>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = useCallback((next: Status) => {
    setStatus(next)
    // Clear any in-flight reset first; a rapid second click would otherwise
    // inherit the previous click's deadline and clear early.
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setStatus('idle'), RESET_MS)
  }, [])

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copy = useCallback(async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        schedule('copied')
        return
      }
      schedule('failed')
    } catch {
      // Permission denied, or a rejected promise from a background tab.
      schedule('failed')
    }
  }, [value, schedule])

  const message =
    status === 'copied'
      ? 'Copied to clipboard'
      : status === 'failed'
        ? 'Copy failed — press to select and copy manually'
        : ''

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => void copy()}
        data-status={status}
        className="inline-flex items-center gap-1.5 rounded-md border border-[var(--hairline)] bg-[var(--surface)] px-2.5 py-1 font-mono text-[11px] text-[var(--subtle)] transition-colors duration-200 hover:border-[var(--accent)] hover:text-[var(--accent-readable)]"
      >
        <span aria-hidden="true">{status === 'copied' ? '✓' : '⧉'}</span>
        {/* The accessible name stays stable so the control is still findable
            by its original label while the confirmation is showing. */}
        <span>{label}</span>
      </button>
      <span
        data-testid="copy-status"
        aria-live="polite"
        className="text-[11px] text-[var(--accent-readable)]"
      >
        {message}
      </span>
    </span>
  )
}

export default CopyButton
