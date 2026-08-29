import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { Settings } from '@/content'

/**
 * The scene module must never be statically imported here — that would pull
 * `three` and `drei` into jsdom. `next/dynamic` is mocked so we can observe
 * whether the loader (i.e. the import of HeroScene) was ever invoked.
 */

const sceneLoads: unknown[] = []
const sceneProps: Record<string, unknown>[] = []

vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<unknown>) => {
    const Dynamic = (props: Record<string, unknown>) => {
      sceneLoads.push(loader)
      sceneProps.push(props)
      return <div data-testid="hero-scene" />
    }
    return Dynamic
  },
}))

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  useFrame: () => {},
  useThree: () => ({}),
}))

vi.mock('@react-three/drei', () => ({
  Icosahedron: () => null,
  MeshDistortMaterial: () => null,
}))

import HeroCanvas from '../HeroCanvas'
import Hero from '@/components/sections/Hero'

const settings = (overrides: Partial<Settings['features']> = {}): Settings =>
  ({
    name: 'Pranav Patil',
    roles: ['Software Engineer', 'Backend & Distributed Systems'],
    bio: 'Builds backend systems.',
    location: 'Gurugram, India',
    email: 'a@b.com',
    resumePdf: '/uploads/resume.pdf',
    socials: [{ label: 'GitHub', url: 'https://github.com/x', icon: 'github' }],
    theme: {
      accent: '#7c5cff',
      background: '#08080c',
      foreground: '#f4f4f7',
      defaultMode: 'dark',
    },
    seo: { title: 't', description: 'd' },
    features: { hero3d: true, mediumImport: false, ...overrides },
  }) as Settings

function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

beforeEach(() => {
  sceneLoads.length = 0
  sceneProps.length = 0
  mockMatchMedia(false)
})

afterEach(() => {
  // Vitest globals are off, so RTL's automatic cleanup never registers.
  cleanup()
  vi.restoreAllMocks()
})

/** jsdom has no WebGL; a truthy stub simulates a capable browser. */
function stubWebgl(supported: boolean) {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    () => (supported ? ({} as never) : null),
  )
}

describe('Hero', () => {
  it('renders the name and every role as real DOM even when the canvas cannot mount', () => {
    stubWebgl(false)
    render(<Hero settings={settings()} />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pranav Patil')
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    expect(screen.getByText('Backend & Distributed Systems')).toBeInTheDocument()
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
  })

  it('renders the call-to-action links as real DOM', () => {
    stubWebgl(false)
    render(<Hero settings={settings()} />)

    expect(screen.getByRole('link', { name: /r(é|e)sum(é|e)/i })).toHaveAttribute(
      'href',
      '/uploads/resume.pdf',
    )
    expect(screen.getByRole('link', { name: /github/i })).toHaveAttribute(
      'href',
      'https://github.com/x',
    )
  })
})

describe('HeroCanvas', () => {
  it('renders the poster and never loads the scene when hero3d is false', () => {
    stubWebgl(true)
    render(<HeroCanvas enabled={false} />)

    expect(screen.getByTestId('hero-poster')).toBeInTheDocument()
    expect(sceneLoads).toHaveLength(0)
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
  })

  it('renders the poster and nothing else when WebGL is unavailable', () => {
    stubWebgl(false)
    render(<HeroCanvas enabled />)

    expect(screen.getByTestId('hero-poster')).toBeInTheDocument()
    expect(sceneLoads).toHaveLength(0)
    expect(screen.queryByTestId('hero-scene')).not.toBeInTheDocument()
  })

  it('loads the scene when hero3d is true and WebGL is available', () => {
    stubWebgl(true)
    render(<HeroCanvas enabled />)

    expect(screen.getByTestId('hero-scene')).toBeInTheDocument()
    expect(sceneLoads.length).toBeGreaterThan(0)
    expect(screen.getByTestId('hero-poster')).toBeInTheDocument()
  })

  it('deactivates scene animation under prefers-reduced-motion', () => {
    stubWebgl(true)
    mockMatchMedia(true)
    render(<HeroCanvas enabled />)

    expect(screen.getByTestId('hero-scene')).toBeInTheDocument()
    expect(sceneProps.at(-1)?.active).toBe(false)
  })

  it('activates scene animation when motion is allowed and the hero is visible', () => {
    stubWebgl(true)
    render(<HeroCanvas enabled />)

    expect(sceneProps.at(-1)?.active).toBe(true)
  })
})
