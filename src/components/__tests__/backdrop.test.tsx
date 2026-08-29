import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'

const sceneLoads: unknown[] = []
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    const Dynamic = () => {
      sceneLoads.push(loader)
      return <div data-testid="field-scene" />
    }
    return Dynamic
  },
}))

import Backdrop from '../Backdrop'

function stubWebgl(available: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => (available ? ({} as unknown as RenderingContext) : null),
  )
}

beforeEach(() => {
  sceneLoads.length = 0
  vi.restoreAllMocks()
})

describe('Backdrop', () => {
  it('is hidden from assistive technology and never intercepts pointer events', () => {
    stubWebgl(true)
    const { container } = render(<Backdrop />)
    const el = screen.getByTestId('backdrop')
    expect(el).toHaveAttribute('aria-hidden', 'true')
    expect(el.className).toContain('pointer-events-none')
    expect(container.querySelector('[data-testid="backdrop"]')).not.toBeNull()
  })

  it('renders the static gradient and no scene when WebGL is unavailable', () => {
    stubWebgl(false)
    render(<Backdrop />)
    expect(screen.getByTestId('backdrop')).toBeInTheDocument()
    expect(screen.queryByTestId('field-scene')).not.toBeInTheDocument()
  })

  it('never loads the scene when disabled', () => {
    stubWebgl(true)
    render(<Backdrop enabled={false} />)
    expect(screen.queryByTestId('field-scene')).not.toBeInTheDocument()
    expect(sceneLoads).toHaveLength(0)
  })

  it('loads the scene when enabled and WebGL is available', () => {
    stubWebgl(true)
    render(<Backdrop enabled />)
    expect(screen.getByTestId('field-scene')).toBeInTheDocument()
  })

  it('server-renders the gradient only, so first paint never waits on WebGL', () => {
    const html = renderToStaticMarkup(<Backdrop />)
    expect(html).toContain('data-testid="backdrop"')
    expect(html).not.toContain('field-scene')
  })
})
