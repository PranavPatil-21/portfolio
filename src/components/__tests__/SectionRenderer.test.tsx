import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import SectionRenderer, { type SiteContent } from '../SectionRenderer'

vi.mock('@/components/sections/Experience', () => ({ default: () => <div>EXPERIENCE</div> }))
vi.mock('@/components/sections/Projects', () => ({ default: () => <div>PROJECTS</div> }))
vi.mock('@/components/sections/Skills', () => ({ default: () => <div>SKILLS</div> }))
vi.mock('@/components/sections/Education', () => ({ default: () => <div>EDUCATION</div> }))
vi.mock('@/components/sections/Responsibilities', () => ({ default: () => <div>RESP</div> }))
vi.mock('@/components/sections/Contact', () => ({ default: () => <div>CONTACT</div> }))
vi.mock('@/components/sections/Articles', () => ({ default: () => <div>ARTICLES</div> }))
vi.mock('@/components/sections/CustomSection', () => ({
  default: ({ section }: { section: { title: string } }) => <div>CUSTOM:{section.title}</div>,
}))

const content = {
  settings: {} as SiteContent['settings'],
  experience: [], projects: [], skills: [], education: [],
  responsibilities: [], articles: [],
  customSections: [
    { slug: 'talks', title: 'Talks', layout: 'cards', items: [], order: 0, body: '' },
  ],
} as unknown as SiteContent

describe('SectionRenderer', () => {
  it('renders sections in layout order', () => {
    render(
      <SectionRenderer
        layout={[
          { sectionId: 'projects', visible: true },
          { sectionId: 'contact', visible: true },
        ]}
        content={content}
      />,
    )
    const text = document.body.textContent ?? ''
    expect(text.indexOf('PROJECTS')).toBeLessThan(text.indexOf('CONTACT'))
  })

  it('renders nothing for hero — the sticky rail owns identity', () => {
    render(
      <SectionRenderer layout={[{ sectionId: 'hero', visible: true }]} content={content} />,
    )
    expect(document.body.textContent?.trim()).toBe('')
  })

  it('skips sections marked not visible', () => {
    render(
      <SectionRenderer
        layout={[
          { sectionId: 'contact', visible: true },
          { sectionId: 'projects', visible: false },
        ]}
        content={content}
      />,
    )
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
    expect(screen.queryByText('PROJECTS')).not.toBeInTheDocument()
  })

  it('skips an unknown sectionId without crashing', () => {
    expect(() =>
      render(
        <SectionRenderer
          layout={[
            { sectionId: 'custom:deleted-last-week', visible: true },
            { sectionId: 'contact', visible: true },
          ]}
          content={content}
        />,
      ),
    ).not.toThrow()
    expect(screen.getByText('CONTACT')).toBeInTheDocument()
  })

  it('interleaves custom sections with built-in ones', () => {
    render(
      <SectionRenderer
        layout={[
          { sectionId: 'experience', visible: true },
          { sectionId: 'custom:talks', visible: true },
          { sectionId: 'contact', visible: true },
        ]}
        content={content}
      />,
    )
    const text = document.body.textContent ?? ''
    expect(text.indexOf('EXPERIENCE')).toBeLessThan(text.indexOf('CUSTOM:Talks'))
    expect(text.indexOf('CUSTOM:Talks')).toBeLessThan(text.indexOf('CONTACT'))
  })
})
