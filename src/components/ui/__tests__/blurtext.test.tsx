import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import BlurText from '../BlurText'

function mockMedia(reduced: boolean) {
  vi.stubGlobal('matchMedia', (q: string) => ({
    matches: reduced && q.includes('reduce'),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    onchange: null,
    dispatchEvent: () => false,
  }))
}

beforeEach(() => { vi.unstubAllGlobals(); mockMedia(false) })

describe('BlurText', () => {
  it('keeps words separated by real spaces', async () => {
    render(<BlurText text="one two three" />)
    // The separating space must be a text node between spans; whitespace at the
    // edge of an inline-block collapses and the sentence runs together.
    expect(document.body.textContent).toContain('one two three')
    expect(document.body.textContent).not.toContain('onetwo')
  })

  it('strips the asterisk emphasis markers from visible text', () => {
    render(<BlurText text="lifted repayments by *40%* overall" />)
    expect(document.body.textContent).toContain('lifted repayments by 40% overall')
    expect(document.body.textContent).not.toContain('*')
  })

  it('renders plain visible text on the server, never opacity 0', () => {
    const html = renderToStaticMarkup(<BlurText text="server rendered copy" />)
    expect(html).toContain('server rendered copy')
    expect(html).not.toMatch(/opacity:\s*0/)
    expect(html).not.toContain('blur(8px)')
  })

  it('renders plain text under reduced motion', () => {
    mockMedia(true)
    render(<BlurText text="reduced motion copy" />)
    expect(screen.getByText('reduced motion copy')).toBeInTheDocument()
  })
})
