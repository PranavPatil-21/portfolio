import { afterEach, describe, it, expect, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Article } from '@/content'
import Articles from '@/components/sections/Articles'

vi.mock('@/components/ui/SectionShell', () => ({
  default: ({
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
  default: ({ children, className }: { children: ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}))
vi.mock('@/components/ui/Tag', () => ({
  default: ({ children }: { children: ReactNode }) => <span data-testid="tag">{children}</span>,
}))
vi.mock('@/components/ui/Reveal', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

// The vitest config does not set `globals: true`, so RTL's automatic
// afterEach cleanup is never registered. Without this, DOM from one test leaks
// into the next and every getBy* query finds duplicates.
afterEach(cleanup)

function article(overrides: Partial<Article> = {}): Article {
  return {
    slug: 'hello-world',
    title: 'Hello World',
    excerpt: 'A short teaser.',
    body: '',
    tags: ['testing'],
    date: '2026-08-01',
    draft: false,
    source: 'native',
    hasFullText: true,
    ...overrides,
  } as Article
}

describe('<Articles />', () => {
  it('returns null when there are no articles', () => {
    const { container } = render(<Articles items={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders the section heading and each article title', () => {
    render(<Articles items={[article(), article({ slug: 'second', title: 'Second Post' })]} />)
    expect(screen.getByRole('heading', { name: /writing/i })).toBeInTheDocument()
    expect(screen.getByText('Hello World')).toBeInTheDocument()
    expect(screen.getByText('Second Post')).toBeInTheDocument()
  })

  it('links a full-text article to its on-site detail route', () => {
    render(<Articles items={[article()]} />)
    const link = screen.getByRole('link', { name: /Hello World/i })
    expect(link).toHaveAttribute('href', '/articles/hello-world')
    expect(link).not.toHaveAttribute('target')
  })

  it('links an article without full text out to its external URL', () => {
    render(
      <Articles
        items={[
          article({
            slug: 'medium-post',
            title: 'Medium Post',
            hasFullText: false,
            source: 'medium',
            externalUrl: 'https://medium.com/@pranav/medium-post',
            canonicalUrl: 'https://medium.com/@pranav/medium-post',
          }),
        ]}
      />,
    )
    const link = screen.getByRole('link', { name: /Medium Post/i })
    expect(link).toHaveAttribute('href', 'https://medium.com/@pranav/medium-post')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })

  it('visibly labels an externally hosted article', () => {
    render(
      <Articles
        items={[
          article({
            slug: 'medium-post',
            title: 'Medium Post',
            hasFullText: false,
            externalUrl: 'https://medium.com/@pranav/medium-post',
          }),
        ]}
      />,
    )
    expect(screen.getByText(/hosted on medium/i)).toBeInTheDocument()
  })

  it('falls back to the internal route when full text is absent but no external URL is set', () => {
    render(<Articles items={[article({ hasFullText: false })]} />)
    expect(screen.getByRole('link', { name: /Hello World/i })).toHaveAttribute(
      'href',
      '/articles/hello-world',
    )
  })

  it('renders article tags', () => {
    render(<Articles items={[article()]} />)
    expect(screen.getByText('testing')).toBeInTheDocument()
  })

  it('renders a link to the full article index', () => {
    render(<Articles items={[article()]} />)
    expect(screen.getByRole('link', { name: /all articles/i })).toHaveAttribute('href', '/articles')
  })
})
