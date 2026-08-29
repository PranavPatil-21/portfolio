import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import type { Project, Settings } from '@/content'

/**
 * The case-study route is a server component tree. Two things make it testable:
 * the content API is mocked so the fixtures are stable regardless of what is on
 * disk, and `MarkdownBody` — itself an async component React's client renderer
 * cannot resolve — is stubbed. Everything else is the real page.
 */

function project(overrides: Partial<Project> = {}): Project {
  return {
    slug: 'alpha',
    title: 'Alpha',
    summary: 'The alpha summary.',
    body: '## Alpha body',
    tech: ['Java'],
    repo: undefined,
    demo: undefined,
    cover: undefined,
    coverAlt: undefined,
    featured: false,
    date: '2025-01',
    order: 1,
    category: 'systems',
    role: undefined,
    context: undefined,
    problem: undefined,
    approach: undefined,
    decision: undefined,
    outcome: undefined,
    metrics: [],
    flow: [],
    ...overrides,
  }
}

const settings = {
  name: 'Pranav Patil',
  seo: { title: 'Pranav Patil', description: 'Site description', ogImage: undefined },
} as unknown as Settings

const projects: Project[] = [
  project({ slug: 'alpha', title: 'Alpha', order: 1 }),
  project({ slug: 'beta', title: 'Beta', order: 2, category: 'ai' }),
  project({ slug: 'gamma', title: 'Gamma', order: 3, category: 'product' }),
]

const state: { projects: Project[]; articles: unknown[] } = { projects, articles: [] }

vi.mock('@/content', () => ({
  getProjects: () => state.projects,
  getSettings: () => settings,
  // The page reads this to decide whether the Writing nav link is worth
  // showing — an empty articles page behind a nav link reads as an unfinished
  // site rather than an empty section.
  getNativeArticles: () => state.articles,
}))

vi.mock('@/lib/markdown', () => ({
  MarkdownBody: ({ content }: { content: string }) => (
    <div data-testid="markdown-body">{content}</div>
  ),
  proseClassName: '',
}))

const notFound = vi.fn(() => {
  throw new Error('NEXT_NOT_FOUND')
})
vi.mock('next/navigation', () => ({ notFound: () => notFound() }))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

import CaseStudyPage, {
  generateMetadata,
  generateStaticParams,
} from '@/app/work/[slug]/page'
import WorkIndexPage from '@/app/work/page'

async function renderCaseStudy(slug: string) {
  render(await CaseStudyPage({ params: Promise.resolve({ slug }) }))
}

beforeEach(() => {
  state.projects = projects
  notFound.mockClear()
})

describe('generateStaticParams', () => {
  it('returns one entry per project', async () => {
    const params = await generateStaticParams()
    expect(params).toEqual([{ slug: 'alpha' }, { slug: 'beta' }, { slug: 'gamma' }])
  })
})

describe('generateMetadata', () => {
  it('uses the project title and summary', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'alpha' }) })
    expect(meta.title).toBe('Alpha')
    expect(meta.description).toBe('The alpha summary.')
  })

  it('degrades gracefully for an unknown slug', async () => {
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'nope' }) })
    expect(meta.title).toBeTruthy()
  })
})

describe('case study page', () => {
  it('calls notFound for an unknown slug', async () => {
    await expect(renderCaseStudy('nope')).rejects.toThrow('NEXT_NOT_FOUND')
    expect(notFound).toHaveBeenCalled()
  })

  it('renders the header, standfirst and body', async () => {
    state.projects = [
      project({
        slug: 'alpha',
        title: 'Alpha',
        context: 'Wio Bank · lending',
        role: 'Architect',
      }),
    ]
    await renderCaseStudy('alpha')

    expect(screen.getByRole('heading', { level: 1, name: 'Alpha' })).toBeInTheDocument()
    expect(screen.getByText('The alpha summary.')).toBeInTheDocument()
    expect(screen.getByText('Wio Bank · lending')).toBeInTheDocument()
    expect(screen.getByText('Architect')).toBeInTheDocument()
    expect(screen.getByText('systems')).toBeInTheDocument()
    expect(screen.getByTestId('markdown-body')).toHaveTextContent('## Alpha body')
  })

  it('renders each narrative section that is present', async () => {
    state.projects = [
      project({
        problem: 'The problem text.',
        approach: 'The approach text.',
        decision: 'The decision text.',
        outcome: 'The outcome text.',
      }),
    ]
    await renderCaseStudy('alpha')

    for (const label of ['Problem', 'Approach', 'The decision', 'Outcome']) {
      expect(screen.getByRole('heading', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByText('The problem text.')).toBeInTheDocument()
    expect(screen.getByText('The approach text.')).toBeInTheDocument()
    expect(screen.getByText('The decision text.')).toBeInTheDocument()
    expect(screen.getByText('The outcome text.')).toBeInTheDocument()
  })

  it('omits narrative sections that are absent', async () => {
    state.projects = [project({ problem: 'Only the problem.' })]
    await renderCaseStudy('alpha')

    expect(screen.getByRole('heading', { name: 'Problem' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Approach' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'The decision' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Outcome' })).toBeNull()
  })

  it('renders metrics when present', async () => {
    state.projects = [
      project({
        metrics: [
          { value: '800K+', label: 'monthly events' },
          { value: '99%', label: 'delivery rate' },
        ],
      }),
    ]
    await renderCaseStudy('alpha')

    expect(screen.getByText('800K+')).toBeInTheDocument()
    expect(screen.getByText('monthly events')).toBeInTheDocument()
    expect(screen.getByText('99%')).toBeInTheDocument()
    expect(screen.getByText('delivery rate')).toBeInTheDocument()
  })

  it('omits the metrics list when there are none', async () => {
    state.projects = [project({ metrics: [] })]
    await renderCaseStudy('alpha')
    expect(screen.queryByTestId('case-study-metrics')).toBeNull()
  })

  it('renders the tech stack', async () => {
    state.projects = [project({ tech: ['Kafka', 'Spring Boot'] })]
    await renderCaseStudy('alpha')
    expect(screen.getByText('Kafka')).toBeInTheDocument()
    expect(screen.getByText('Spring Boot')).toBeInTheDocument()
  })

  it('shows repo and demo links only when set', async () => {
    state.projects = [project({ repo: undefined, demo: undefined })]
    await renderCaseStudy('alpha')
    expect(screen.queryByRole('link', { name: /source/i })).toBeNull()
    expect(screen.queryByRole('link', { name: /demo/i })).toBeNull()
  })

  it('renders repo and demo links when set', async () => {
    state.projects = [
      project({ repo: 'https://github.com/x/y', demo: 'https://demo.example.com' }),
    ]
    await renderCaseStudy('alpha')
    expect(screen.getByRole('link', { name: /source/i })).toHaveAttribute(
      'href',
      'https://github.com/x/y',
    )
    expect(screen.getByRole('link', { name: /demo/i })).toHaveAttribute(
      'href',
      'https://demo.example.com',
    )
  })

  it('links back to the work index', async () => {
    await renderCaseStudy('beta')
    const back = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === '/work')
    expect(back.length).toBeGreaterThan(0)
  })

  it('offers prev and next between neighbouring case studies', async () => {
    await renderCaseStudy('beta')
    expect(screen.getByTestId('case-study-prev')).toHaveAttribute('href', '/work/alpha')
    expect(screen.getByTestId('case-study-next')).toHaveAttribute('href', '/work/gamma')
  })

  it('wraps prev at the first case study', async () => {
    await renderCaseStudy('alpha')
    expect(screen.getByTestId('case-study-prev')).toHaveAttribute('href', '/work/gamma')
    expect(screen.getByTestId('case-study-next')).toHaveAttribute('href', '/work/beta')
  })

  it('wraps next at the last case study', async () => {
    await renderCaseStudy('gamma')
    expect(screen.getByTestId('case-study-next')).toHaveAttribute('href', '/work/alpha')
    expect(screen.getByTestId('case-study-prev')).toHaveAttribute('href', '/work/beta')
  })

  it('hides prev/next when there is only one case study', async () => {
    state.projects = [project()]
    await renderCaseStudy('alpha')
    expect(screen.queryByTestId('case-study-prev')).toBeNull()
    expect(screen.queryByTestId('case-study-next')).toBeNull()
  })
})

describe('work index', () => {
  it('lists every project, grouped by category', () => {
    render(WorkIndexPage())

    expect(screen.getByRole('link', { name: /Alpha/ })).toHaveAttribute(
      'href',
      '/work/alpha',
    )
    expect(screen.getByRole('link', { name: /Beta/ })).toHaveAttribute('href', '/work/beta')
    expect(screen.getByRole('link', { name: /Gamma/ })).toHaveAttribute(
      'href',
      '/work/gamma',
    )

    const groups = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(groups).toEqual(['AI', 'Systems', 'Product'])
  })

  it('omits a category group with no projects', () => {
    state.projects = [project({ category: 'ai' })]
    render(WorkIndexPage())
    const groups = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)
    expect(groups).toEqual(['AI'])
  })
})
