import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import JsonLd from '../JsonLd'
import type { Settings } from '@/content/schemas'

const settings: Settings = {
  name: 'Ada Lovelace',
  roles: ['Analytical Engine Programmer', 'Mathematician'],
  bio: 'Wrote the first algorithm intended for a machine.',
  location: 'London, UK',
  email: 'ada@example.com',
  socials: [
    { label: 'GitHub', url: 'https://github.com/ada', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/ada', icon: 'linkedin' },
    { label: 'Email', url: 'mailto:ada@example.com', icon: 'mail' },
  ],
  theme: {
    accent: '#7c5cff',
    background: '#08080c',
    foreground: '#f4f4f7',
    defaultMode: 'dark',
  },
  seo: { title: 'Ada Lovelace', description: 'Notes and work.' },
  features: { hero3d: true, mediumImport: false },
}

function parse(container: HTMLElement) {
  const script = container.querySelector(
    'script[type="application/ld+json"]',
  ) as HTMLScriptElement | null
  expect(script).not.toBeNull()
  return JSON.parse(script!.textContent ?? '')
}

describe('JsonLd', () => {
  it('emits a schema.org Person with the owner name', () => {
    const { container } = render(<JsonLd settings={settings} />)
    const data = parse(container)
    expect(data['@context']).toBe('https://schema.org')
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe('Ada Lovelace')
  })

  it('uses the first role as jobTitle and carries bio and email', () => {
    const { container } = render(<JsonLd settings={settings} />)
    const data = parse(container)
    expect(data.jobTitle).toBe('Analytical Engine Programmer')
    expect(data.description).toBe(settings.bio)
    expect(data.email).toBe('ada@example.com')
  })

  it('populates sameAs from web socials, excluding mailto and tel links', () => {
    const { container } = render(<JsonLd settings={settings} />)
    const data = parse(container)
    expect(data.sameAs).toEqual([
      'https://github.com/ada',
      'https://linkedin.com/in/ada',
    ])
  })

  it('omits sameAs entirely when there are no web socials', () => {
    const { container } = render(
      <JsonLd settings={{ ...settings, socials: [] }} />,
    )
    const data = parse(container)
    expect(data.sameAs).toBeUndefined()
  })
})
