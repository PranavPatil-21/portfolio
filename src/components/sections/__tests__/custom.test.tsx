import { describe, it, expect, afterEach, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { CustomItem, CustomSection as CustomSectionType } from '@/content/schemas'

/**
 * The UI primitives are owned by a parallel task. Mock them so this suite tests
 * the custom-section dispatch and layouts in isolation and runs standalone.
 */
vi.mock('@/components/ui/SectionShell', () => ({
  SectionShell: ({
    id,
    title,
    subtitle,
    children,
  }: {
    id: string
    title: string
    subtitle?: string
    children: ReactNode
  }) => (
    <section id={id}>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
      {children}
    </section>
  ),
}))

vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}))

vi.mock('@/components/ui/Tag', () => ({
  Tag: ({ children }: { children: ReactNode }) => <span data-testid="tag">{children}</span>,
}))

vi.mock('@/components/ui/Reveal', () => ({
  Reveal: ({ children }: { children: ReactNode; delay?: number }) => <>{children}</>,
}))

const { CustomSection } = await import('../CustomSection')

// This project does not enable Vitest globals, so RTL's auto-cleanup never wires
// up; without this each `it.each` case leaks its DOM into the next one.
afterEach(cleanup)

function item(overrides: Partial<CustomItem> = {}): CustomItem {
  return {
    title: 'Scaling Kafka consumers',
    subtitle: 'DevFest Dubai',
    date: '2026-04-12',
    description: 'A talk about backpressure.',
    tags: [],
    links: [],
    ...overrides,
  }
}

function section(overrides: Partial<CustomSectionType> = {}): CustomSectionType {
  return {
    slug: 'talks',
    title: 'Talks',
    layout: 'cards',
    items: [item()],
    order: 0,
    body: '',
    ...overrides,
  }
}

const layouts = ['cards', 'timeline', 'list', 'logo-grid'] as const

describe('CustomSection', () => {
  it.each(layouts)('renders its items in the %s layout', (layout) => {
    render(
      <CustomSection
        section={section({
          layout,
          items: [
            item({ title: 'First item' }),
            item({ title: 'Second item', subtitle: 'Somewhere else' }),
          ],
        })}
      />,
    )

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Talks')
    expect(screen.getByText('First item')).toBeInTheDocument()
    expect(screen.getByText('Second item')).toBeInTheDocument()
  })

  it('addresses the section by its custom: slug id so page assembly can find it', () => {
    const { container } = render(<CustomSection section={section({ slug: 'talks' })} />)
    expect(container.querySelector('section')?.getAttribute('id')).toBe('custom:talks')
  })

  it('falls back to the cards layout when the layout value is unknown', () => {
    const unknown = 'mosaic' as unknown as CustomSectionType['layout']

    expect(() =>
      render(<CustomSection section={section({ layout: unknown, items: [item({ title: 'Drifted' })] })} />),
    ).not.toThrow()

    expect(screen.getByText('Drifted')).toBeInTheDocument()
    // cards layout is the one that renders Card surfaces
    expect(screen.getAllByTestId('card')).toHaveLength(1)
  })

  it.each(layouts)('renders nothing for a %s section with no items', (layout) => {
    const { container } = render(<CustomSection section={section({ layout, items: [] })} />)
    expect(container).toBeEmptyDOMElement()
  })

  it.each(layouts)('renders item links with their label as the accessible name (%s)', (layout) => {
    render(
      <CustomSection
        section={section({
          layout,
          items: [
            item({
              links: [
                { label: 'Watch the recording', url: 'https://example.com/video' },
                { label: 'Slides', url: 'https://example.com/slides' },
              ],
            }),
          ],
        })}
      />,
    )

    expect(screen.getByRole('link', { name: 'Watch the recording' })).toHaveAttribute(
      'href',
      'https://example.com/video',
    )
    expect(screen.getByRole('link', { name: 'Slides' })).toBeInTheDocument()
  })

  it.each(layouts)('renders an item image with its imageAlt as alt text (%s)', (layout) => {
    render(
      <CustomSection
        section={section({
          layout,
          items: [item({ image: '/uploads/badge.png', imageAlt: 'Conference badge' })],
        })}
      />,
    )

    expect(screen.getByAltText('Conference badge')).toHaveAttribute('src', '/uploads/badge.png')
  })

  it.each(layouts)('renders an image with an empty alt, never undefined, when imageAlt is absent (%s)', (layout) => {
    const { container } = render(
      <CustomSection
        section={section({ layout, items: [item({ image: '/uploads/badge.png' })] })}
      />,
    )

    const img = container.querySelector('img')
    expect(img).not.toBeNull()
    expect(img).toHaveAttribute('alt', '')
  })

  it.each(layouts)('renders item tags (%s)', (layout) => {
    render(
      <CustomSection
        section={section({ layout, items: [item({ tags: ['kafka', 'observability'] })] })}
      />,
    )

    expect(screen.getByText('kafka')).toBeInTheDocument()
    expect(screen.getByText('observability')).toBeInTheDocument()
  })

  it.each(layouts)('renders the item date (%s)', (layout) => {
    render(
      <CustomSection section={section({ layout, items: [item({ date: '2026-04-12' })] })} />,
    )
    expect(screen.getByText('2026-04-12')).toBeInTheDocument()
  })

  it('renders the section body as a subtitle when present', () => {
    render(<CustomSection section={section({ body: 'Places I have spoken.' })} />)
    expect(screen.getByText('Places I have spoken.')).toBeInTheDocument()
  })
})

/**
 * The owner chooses between these four from the CMS. If two of them ever
 * collapsed into the same shape that choice would silently stop meaning
 * anything, and nothing else in the suite would notice — every other assertion
 * here is about content, which all four render identically by design.
 *
 * So pin the *structure*: each layout has one signature element the other three
 * do not have.
 */
describe('custom layouts stay structurally distinct', () => {
  function renderLayout(layout: (typeof layouts)[number]) {
    return render(
      <CustomSection
        section={section({ layout, items: [item({ title: 'First' }), item({ title: 'Second' })] })}
      />,
    )
  }

  it('cards is the surface grid — one Card per item, no rail, no figure', () => {
    const { container } = renderLayout('cards')
    expect(screen.getAllByTestId('card')).toHaveLength(2)
    expect(container.querySelector('ol')).toBeNull()
    expect(container.querySelector('figure')).toBeNull()
  })

  it('timeline is the ordered rail — an <ol>, no Card surfaces, no figure', () => {
    const { container } = renderLayout('timeline')
    expect(container.querySelector('ol')).not.toBeNull()
    expect(screen.queryAllByTestId('card')).toHaveLength(0)
    expect(container.querySelector('figure')).toBeNull()
  })

  it('logo-grid is the tile wall — a <figure> per item, no rail, no Card surfaces', () => {
    const { container } = renderLayout('logo-grid')
    expect(container.querySelectorAll('figure')).toHaveLength(2)
    expect(container.querySelector('ol')).toBeNull()
    expect(screen.queryAllByTestId('card')).toHaveLength(0)
  })

  it('list is the flat register — no Card surface, no rail, no figure', () => {
    const { container } = renderLayout('list')
    expect(screen.queryAllByTestId('card')).toHaveLength(0)
    expect(container.querySelector('ol')).toBeNull()
    expect(container.querySelector('figure')).toBeNull()
    // still a list of rows, just an unordered one
    expect(container.querySelectorAll('li')).toHaveLength(2)
  })

  it('renders a title-only item in every layout without crashing', () => {
    for (const layout of layouts) {
      const { unmount } = render(
        <CustomSection
          section={section({
            layout,
            items: [
              {
                title: 'Bare item',
                tags: [],
                links: [],
              } as CustomItem,
            ],
          })}
        />,
      )
      expect(screen.getByText('Bare item')).toBeInTheDocument()
      unmount()
    }
  })
})
