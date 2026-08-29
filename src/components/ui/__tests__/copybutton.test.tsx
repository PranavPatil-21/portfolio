import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import CopyButton from '../CopyButton'

function stubClipboard(impl: () => Promise<void>) {
  const writeText = vi.fn(impl)
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
    writable: true,
  })
  return writeText
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('CopyButton', () => {
  it('copies the value and confirms, then returns to the idle label', async () => {
    const writeText = stubClipboard(() => Promise.resolve())
    render(<CopyButton value="hello@example.com" label="Copy email" />)

    const button = screen.getByRole('button', { name: /Copy email/ })
    fireEvent.click(button)

    expect(writeText).toHaveBeenCalledWith('hello@example.com')
    await waitFor(() => expect(screen.getByTestId('copy-status')).toHaveTextContent(/copied/i))

    // Never permanently "copied" — the confirmed state clears itself.
    await act(async () => {
      vi.advanceTimersByTime(2500)
    })
    expect(screen.getByTestId('copy-status')).not.toHaveTextContent(/copied/i)
    expect(screen.getByRole('button', { name: /Copy email/ })).toBeInTheDocument()
  })

  it('announces the result through a polite live region that is always mounted', () => {
    stubClipboard(() => Promise.resolve())
    render(<CopyButton value="x" />)
    const status = screen.getByTestId('copy-status')
    expect(status).toHaveAttribute('aria-live', 'polite')
  })

  it('survives a rejected clipboard promise without throwing or falsely confirming', async () => {
    stubClipboard(() => Promise.reject(new Error('permission denied')))
    render(<CopyButton value="x" label="Copy" />)

    fireEvent.click(screen.getByRole('button', { name: /Copy/ }))

    await waitFor(() =>
      expect(screen.getByTestId('copy-status')).toHaveTextContent(/press|failed|manually/i),
    )
    expect(screen.getByTestId('copy-status')).not.toHaveTextContent(/copied/i)
  })

  it('does not throw when navigator.clipboard is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    })
    render(<CopyButton value="x" label="Copy" />)

    expect(() => fireEvent.click(screen.getByRole('button', { name: /Copy/ }))).not.toThrow()
    await waitFor(() =>
      expect(screen.getByTestId('copy-status')).not.toHaveTextContent(/copied/i),
    )
  })
})
