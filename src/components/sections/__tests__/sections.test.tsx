import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent, within } from '@testing-library/react'

// Vitest is not running with `globals: true`, so RTL's auto-cleanup hook never
// registers. Without this, renders accumulate and every `getBy*` finds duplicates.
afterEach(cleanup)
import type {
  Education as EducationItem,
  Experience as ExperienceItem,
  Project,
  Responsibility,
  Settings,
  SkillGroup,
} from '@/content/schemas'

/**
 * The UI primitives are owned by another task. Mock them faithfully — the shell
 * must still emit a real `<section id>` and a real `<h2>`, otherwise the heading
 * and landmark assertions below would pass against an empty stub and prove
 * nothing about the tree these components actually build.
 */
vi.mock('@/components/ui/SectionShell', () => {
  function SectionShell({
    id,
    title,
    subtitle,
    children,
  }: {
    id: string
    title: string
    subtitle?: string
    children: ReactNode
  }) {
    return (
      <section id={id} aria-labelledby={`${id}-heading`}>
        <h2 id={`${id}-heading`}>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
        {children}
      </section>
    )
  }
  return { SectionShell, default: SectionShell }
})

vi.mock('@/components/ui/Card', () => {
  function Card({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={className}>{children}</div>
  }
  return { Card, default: Card }
})

vi.mock('@/components/ui/Tag', () => {
  function Tag({ children }: { children: ReactNode }) {
    return <span>{children}</span>
  }
  return { Tag, default: Tag }
})

vi.mock('@/components/ui/Reveal', () => {
  function Reveal({ children }: { children: ReactNode; delay?: number; className?: string }) {
    return <div>{children}</div>
  }
  return { Reveal, default: Reveal }
})

import { Experience, parseEmphasis } from '../Experience'
import { Projects } from '../Projects'
import { Skills } from '../Skills'
import { Metrics, parseMetric } from '../Metrics'
import { Education } from '../Education'
import { Responsibilities } from '../Responsibilities'
import { Contact } from '../Contact'

// ---------------------------------------------------------------- fixtures

const experienceFixture: ExperienceItem[] = [
  {
    slug: 'wio-software-engineer',
    role: 'Software Engineer',
    company: 'Wio Bank PJSC',
    location: 'Gurugram, India',
    start: '2024-09',
    current: true,
    bullets: [
      'Architected a Kafka-based lending billing engine.',
      'Cut settlement latency by *40% across 800K daily events*, unblocking same-day payouts.',
    ],
    tech: ['Java', 'Kafka'],
    order: 1,
    body: '',
  },
  {
    slug: 'wio-intern',
    role: 'Software Engineer Intern',
    company: 'Wio Bank PJSC',
    location: 'Remote, India',
    start: '2024-02',
    end: '2024-08',
    current: false,
    bullets: ['Built a Spring Boot deduplication API.'],
    tech: ['Spring Boot'],
    order: 2,
    body: '',
  },
]

const projectFixture: Project[] = [
  {
    slug: 'aes-double-pendulum',
    title: 'AES Cryptosystem via Double Pendulum',
    summary: 'Chaos-driven key generation for AES.',
    body:
      '## The problem\n\nRestates the summary at four times the length.\n\n' +
      '## The decision\n\nUse a `double pendulum` — the textbook **chaotic** system, ' +
      'deterministic from a seed yet [practically](https://example.com) unpredictable ' +
      'without it.\n\n## Later\n\nA third section that must not reach the card.',
    tech: ['C++', 'Cryptography'],
    repo: 'https://github.com/PranavPatil-21/aes',
    demo: 'https://example.com/demo',
    cover: '/uploads/aes.png',
    coverAlt: 'A double pendulum trace',
    featured: true,
    date: '2023-09',
    order: 1,
    category: 'systems',
    metrics: [],
    flow: [],
  },
]

const projectWithoutLinks: Project[] = [
  {
    slug: 'splitwise',
    title: 'Splitwise Backend Clone',
    summary: 'Expense splitting and debt simplification.',
    body: '',
    tech: ['Java'],
    featured: false,
    category: 'systems',
    metrics: [],
    flow: [],
    date: '2023-04',
    order: 2,
  },
]

const skillsFixture: SkillGroup[] = [
  { label: 'Languages', items: ['Java', 'C/C++', 'SQL'] },
  { label: 'Databases', items: ['PostgreSQL', 'MongoDB'] },
]

const educationFixture: EducationItem[] = [
  {
    slug: 'dau',
    institution: 'Dhirubhai Ambani University',
    degree: 'B.Tech in Information and Communication Technology',
    location: 'Gandhinagar, India',
    start: '2020-11',
    end: '2024-05',
    details: ['Graduated with distinction.'],
    order: 1,
    body: '',
  },
]

const responsibilitiesFixture: Responsibility[] = [
  {
    slug: 'ieee-chairperson',
    role: 'Chairperson, IEEE Society DAU',
    organisation: 'Dhirubhai Ambani University',
    location: 'Gandhinagar, India',
    start: '2022-12',
    end: '2024-05',
    bullets: ['Led a 25+ member team.'],
    order: 1,
    body: '',
  },
]

const baseSettings: Settings = {
  name: 'Pranav Patil',
  roles: ['Software Engineer'],
  bio: 'Backend engineer.',
  location: 'Gurugram, India',
  email: 'pranavnarendrapatil.2104@gmail.com',
  phone: '+91 7623955135',
  resumePdf: '/uploads/resume.pdf',
  socials: [
    { label: 'GitHub', url: 'https://github.com/PranavPatil-21', icon: 'github' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/pranav-patil', icon: 'linkedin' },
  ],
  theme: {
    accent: '#7c5cff',
    background: '#08080c',
    foreground: '#f4f4f7',
    defaultMode: 'dark',
  },
  seo: { title: 'Pranav Patil', description: 'Portfolio' },
  features: { hero3d: true, mediumImport: false },
}

// ---------------------------------------------------------------- Experience

describe('Experience', () => {
  it('renders company, role and every bullet for each role', () => {
    render(<Experience items={experienceFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /experience/i })).toBeInTheDocument()
    // Each role is one compact row: the company heads it, the title sits on the
    // line beneath, and the bullets carry what changed.
    expect(screen.getAllByRole('heading', { level: 3, name: 'Wio Bank PJSC' }).length).toBe(2)
    expect(screen.getByText('Software Engineer')).toBeInTheDocument()
    // Exact-text matching, so the intern row does not satisfy the line above.
    expect(screen.getByText('Software Engineer Intern')).toBeInTheDocument()
    expect(
      screen.getByText('Architected a Kafka-based lending billing engine.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Built a Spring Boot deduplication API.')).toBeInTheDocument()
  })

  it('labels a current role as Present and a finished role with its end date', () => {
    render(<Experience items={experienceFixture} />)
    expect(screen.getByText(/Sep 2024 — Present/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 2024 — Aug 2024/)).toBeInTheDocument()
  })

  it('renders *asterisk* emphasis as an accent span with the asterisks stripped', () => {
    render(<Experience items={experienceFixture} />)

    const emphasised = screen.getByText('40% across 800K daily events')
    expect(emphasised.tagName).toBe('SPAN')
    expect(emphasised.className).toContain('accent-readable')

    // The bullet reads as one uninterrupted sentence, asterisks gone.
    const bullet = emphasised.closest('li')
    expect(bullet?.textContent).toBe(
      'Cut settlement latency by 40% across 800K daily events, unblocking same-day payouts.',
    )
    expect(bullet?.textContent).not.toContain('*')
  })

  it('renders the tech stack as secondary tags', () => {
    render(<Experience items={experienceFixture} />)
    expect(screen.getByText('Kafka')).toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Experience items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('parseEmphasis', () => {
  it('splits a string into plain and emphasised segments', () => {
    expect(parseEmphasis('Cut latency *40%* overall')).toEqual([
      { text: 'Cut latency ', emphasis: false },
      { text: '40%', emphasis: true },
      { text: ' overall', emphasis: false },
    ])
  })

  it('handles multi-word emphasis and a string with no markers', () => {
    expect(parseEmphasis('*shipped to 12 markets*')).toEqual([
      { text: 'shipped to 12 markets', emphasis: true },
    ])
    expect(parseEmphasis('plain text')).toEqual([{ text: 'plain text', emphasis: false }])
  })
})

// ---------------------------------------------------------------- Projects

/**
 * Three case studies across three categories, so the filter has something real
 * to sort. Only the AI entry carries `metrics`, which lets one fixture prove
 * both halves of the "figures render when present, absent when not" rule.
 */
const catalogueFixture: Project[] = [
  {
    slug: 'wiogenie',
    title: 'WioGenie',
    summary: 'A multi-agent incident investigator.',
    body: '',
    tech: ['Python'],
    featured: true,
    date: '2026-02',
    order: 1,
    category: 'ai',
    role: 'Product and engineering lead',
    decision: 'Ship the retrieval layer before the agent loop.',
    metrics: [
      { value: '70%', label: 'triage time saved' },
      { value: '12', label: 'services covered' },
    ],
    flow: [],
  },
  {
    slug: 'lending-billing-engine',
    title: 'Lending Billing Engine',
    summary: 'Kafka-based statement generation at 99% accuracy.',
    body: '',
    tech: ['Kafka'],
    featured: false,
    date: '2025-06',
    order: 2,
    category: 'systems',
    metrics: [],
    flow: [],
  },
  {
    slug: 'fd-backed-sme-lending',
    title: 'FD-Backed SME Lending',
    summary: 'Secured credit journeys for SME customers.',
    body: '',
    tech: ['Java'],
    featured: false,
    date: '2025-09',
    order: 3,
    category: 'product',
    metrics: [],
    flow: [],
  },
]

/** Titles of every card currently rendered, in document order. */
function renderedTitles(): string[] {
  return screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '')
}

describe('Projects', () => {
  it('renders the title, summary and tech of each project', () => {
    render(<Projects items={projectFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /projects/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'AES Cryptosystem via Double Pendulum' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Chaos-driven key generation for AES.')).toBeInTheDocument()
    expect(screen.getByText('C++')).toBeInTheDocument()
  })

  it('numbers each project with a quiet decorative index', () => {
    render(<Projects items={projectFixture} />)
    // Decorative, so it must not reach the accessibility tree as content.
    const index = document.querySelector('[data-testid="project-index"]')
    expect(index).not.toBeNull()
    expect(index).toHaveTextContent('01')
    expect(index).toHaveAttribute('aria-hidden', 'true')
  })

  it('surfaces the decision passage as plain text, with its heading as a label', () => {
    render(<Projects items={projectFixture} />)
    // `summary` already carries the problem, so the excerpt skips the body's
    // opening "The problem" section and lifts the reasoning instead.
    expect(screen.getByText('The decision')).toBeInTheDocument()
    expect(screen.queryByText(/Restates the summary/)).not.toBeInTheDocument()
    // ...and the paragraph beneath it is flattened: no backticks, no asterisks,
    // no link syntax, and no leading "##".
    const excerpt = screen.getByText(/Use a double pendulum/)
    expect(excerpt.textContent).toBe(
      'Use a double pendulum — the textbook chaotic system, deterministic from a seed yet practically unpredictable without it.',
    )
    expect(document.body.textContent).not.toContain('##')
    expect(document.body.textContent).not.toContain('](')
  })

  it('shows one passage of the body, not the whole write-up', () => {
    render(<Projects items={projectFixture} />)
    expect(screen.queryByText(/must not reach the card/)).not.toBeInTheDocument()
    expect(screen.queryByText('Later')).not.toBeInTheDocument()
  })

  it('falls back to the opening passage when no section reads as a decision', () => {
    const noDecision = [
      { ...projectFixture[0], body: '## Background\n\nThe only passage there is.' },
    ]
    render(<Projects items={noDecision} />)
    expect(screen.getByText('Background')).toBeInTheDocument()
    expect(screen.getByText('The only passage there is.')).toBeInTheDocument()
  })

  it('gives a non-featured project the summary alone, with no body excerpt', () => {
    const detailed = [
      { ...projectWithoutLinks[0], body: '## The decision\n\nA supporting passage.' },
    ]
    render(<Projects items={detailed} />)
    expect(screen.getByText('Expense splitting and debt simplification.')).toBeInTheDocument()
    expect(screen.queryByText('A supporting passage.')).not.toBeInTheDocument()
  })

  it('renders the cover image with its alt text', () => {
    render(<Projects items={projectFixture} />)
    expect(screen.getByAltText('A double pendulum trace')).toBeInTheDocument()
  })

  it('renders repo and demo links, each with a discernible name', () => {
    render(<Projects items={projectFixture} />)
    const repo = screen.getByRole('link', { name: /source code.*AES/i })
    expect(repo).toHaveAttribute('href', 'https://github.com/PranavPatil-21/aes')
    const demo = screen.getByRole('link', { name: /live demo.*AES/i })
    expect(demo).toHaveAttribute('href', 'https://example.com/demo')
  })

  it('hides the repo and demo links when they are not set', () => {
    render(<Projects items={projectWithoutLinks} />)
    expect(screen.queryByRole('link', { name: /source code/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /live demo/i })).not.toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Projects items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  // ------------------------------------------------------ the case-study index

  it('renders a card for every case study, whatever its category', () => {
    render(<Projects items={catalogueFixture} />)
    expect(renderedTitles()).toEqual([
      'WioGenie',
      'Lending Billing Engine',
      'FD-Backed SME Lending',
    ])
  })

  it('sorts featured work first, then by order', () => {
    const shuffled = [catalogueFixture[2], catalogueFixture[1], catalogueFixture[0]]
    render(<Projects items={shuffled} />)
    // WioGenie is featured so it leads despite being last in the input array.
    expect(renderedTitles()[0]).toBe('WioGenie')
  })

  it('renders a real button group of category filters, each with a live count', () => {
    render(<Projects items={catalogueFixture} />)

    const group = screen.getByRole('group', { name: /filter/i })
    expect(within(group).getAllByRole('button')).toHaveLength(4)

    expect(screen.getByRole('button', { name: /^All/ })).toBeInTheDocument()
    expect(screen.getByTestId('filter-count-all')).toHaveTextContent('3')
    expect(screen.getByTestId('filter-count-ai')).toHaveTextContent('1')
    expect(screen.getByTestId('filter-count-systems')).toHaveTextContent('1')
    expect(screen.getByTestId('filter-count-product')).toHaveTextContent('1')
  })

  it('filters the list to one category on click, and restores it with All', () => {
    render(<Projects items={catalogueFixture} />)

    fireEvent.click(screen.getByRole('button', { name: /^AI/ }))
    expect(renderedTitles()).toEqual(['WioGenie'])
    expect(screen.queryByRole('heading', { level: 3, name: 'Lending Billing Engine' })).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: /^All/ }))
    expect(renderedTitles()).toHaveLength(3)
  })

  it('tracks the active filter with aria-pressed', () => {
    render(<Projects items={catalogueFixture} />)

    const all = screen.getByRole('button', { name: /^All/ })
    const systems = screen.getByRole('button', { name: /^Systems/ })

    expect(all).toHaveAttribute('aria-pressed', 'true')
    expect(systems).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(systems)
    expect(systems).toHaveAttribute('aria-pressed', 'true')
    expect(all).toHaveAttribute('aria-pressed', 'false')
  })

  it('announces the result count in a polite live region', () => {
    render(<Projects items={catalogueFixture} />)

    const status = screen.getByRole('status')
    expect(status).toHaveTextContent(/3/)

    fireEvent.click(screen.getByRole('button', { name: /^Product/ }))
    expect(screen.getByRole('status')).toHaveTextContent(/1/)
  })

  it('says so when a category is empty rather than rendering a void', () => {
    render(<Projects items={[catalogueFixture[0], catalogueFixture[1]]} />)

    fireEvent.click(screen.getByRole('button', { name: /^Product/ }))
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    // The empty message lives inside the live region so it is announced, not
    // just drawn.
    expect(screen.getByRole('status')).toHaveTextContent(/no case studies/i)
  })

  it('labels each card with its category', () => {
    render(<Projects items={catalogueFixture} />)
    expect(screen.getByTestId('project-category-wiogenie')).toHaveTextContent(/^AI$/)
    expect(screen.getByTestId('project-category-lending-billing-engine')).toHaveTextContent(
      /^Systems$/,
    )
  })

  it('links each case study to its detail page, with a discernible name', () => {
    render(<Projects items={catalogueFixture} />)

    const link = screen.getByRole('link', { name: /read case study.*WioGenie/i })
    expect(link).toHaveAttribute('href', '/work/wiogenie')
    expect(
      screen.getByRole('link', { name: /read case study.*Lending Billing Engine/i }),
    ).toHaveAttribute('href', '/work/lending-billing-engine')
  })

  it('omits the case-study link when the entry has no slug', () => {
    render(<Projects items={[{ ...catalogueFixture[0], slug: '' }]} />)
    expect(screen.queryByRole('link', { name: /read case study/i })).toBeNull()
  })

  it('renders metrics as figures when present, and nothing when not', () => {
    render(<Projects items={catalogueFixture} />)

    const metrics = screen.getByTestId('project-metrics-wiogenie')
    expect(within(metrics).getByText('70%')).toBeInTheDocument()
    expect(within(metrics).getByText('triage time saved')).toBeInTheDocument()
    expect(within(metrics).getByText('12')).toBeInTheDocument()

    expect(screen.queryByTestId('project-metrics-lending-billing-engine')).toBeNull()
  })

  it('prefers the structured decision field over an excerpt of the body', () => {
    render(<Projects items={catalogueFixture} />)
    expect(screen.getByText('Ship the retrieval layer before the agent loop.')).toBeInTheDocument()
  })
})

// ---------------------------------------------------------------- Skills

describe('Skills', () => {
  it('renders each group label and its items', () => {
    render(<Skills groups={skillsFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /skills/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: 'Languages' })).toBeInTheDocument()
    expect(screen.getByText('Java')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
  })

  it('lists every item in a group, each as its own element', () => {
    render(<Skills groups={skillsFixture} />)
    expect(screen.getByText('C/C++')).toBeInTheDocument()
    expect(screen.getByText('MongoDB')).toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Skills groups={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ---------------------------------------------------------------- Metrics

/**
 * `Metrics` reads `prefers-reduced-motion` directly rather than through
 * `motion/react`, so these tests stub `matchMedia` themselves. jsdom ships no
 * implementation at all — the happy path needs the stub just as much as the
 * reduced-motion path, or the component throws on an undefined `matchMedia`.
 */
function stubMatchMedia(reduced: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  )
}

const metricsFixture = [
  { value: '800K+', label: 'monthly events processed' },
  { value: '99.9%', label: 'billing pipeline uptime' },
  { value: '<2s', label: 'p95 settlement latency' },
]

describe('Metrics', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the final value and its label under reduced motion', () => {
    stubMatchMedia(true)
    render(<Metrics items={metricsFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /impact/i })).toBeInTheDocument()
    expect(screen.getByText('800K+')).toBeInTheDocument()
    expect(screen.getByText('monthly events processed')).toBeInTheDocument()
  })

  it('preserves prefixes, suffixes and decimals in the final value', () => {
    stubMatchMedia(true)
    render(<Metrics items={metricsFixture} />)
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('<2s')).toBeInTheDocument()
  })

  it('renders a comparison figure verbatim rather than counting one half of it', () => {
    // Motion allowed: "3s → 1s" still must never read "0s → 1s" on screen, so
    // it renders as typed from the first paint and starts no timer.
    stubMatchMedia(false)
    render(<Metrics items={[{ value: '3s → 1s', label: 'p95 dashboard latency' }]} />)
    const figure = screen.getByText('3s → 1s')
    expect(figure).toBeInTheDocument()
    expect(figure).not.toHaveAttribute('aria-hidden')
  })

  it('uses tabular figures so animated digits do not jitter', () => {
    stubMatchMedia(true)
    render(<Metrics items={metricsFixture} />)
    expect(screen.getByText('800K+').className).toContain('tabular')
  })

  it('starts a count-up from zero when motion is allowed', () => {
    stubMatchMedia(false)
    render(<Metrics items={metricsFixture} />)
    // The full string is still present for a11y and crawlers, whatever the
    // animated figure currently reads.
    expect(screen.getByText('monthly events processed')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-testid="metric-value"]').length).toBe(3)
  })

  it('returns null for an empty array', () => {
    stubMatchMedia(true)
    const { container } = render(<Metrics items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('parseMetric', () => {
  it('splits prefix, digits and suffix and keeps the decimal precision', () => {
    expect(parseMetric('800K+')).toEqual({
      prefix: '',
      target: 800,
      suffix: 'K+',
      decimals: 0,
    })
    expect(parseMetric('99.9%')).toEqual({
      prefix: '',
      target: 99.9,
      suffix: '%',
      decimals: 1,
    })
    expect(parseMetric('<2s')).toEqual({ prefix: '<', target: 2, suffix: 's', decimals: 0 })
  })

  it('reads through digit grouping', () => {
    expect(parseMetric('1,200')).toEqual({
      prefix: '',
      target: 1200,
      suffix: '',
      decimals: 0,
    })
  })

  it('returns null when there is nothing to count', () => {
    expect(parseMetric('N/A')).toBeNull()
  })

  it('returns null for a comparison, where animating one number would mislead', () => {
    expect(parseMetric('3s → 1s')).toBeNull()
    expect(parseMetric('40% of 800K')).toBeNull()
  })
})

// ---------------------------------------------------------------- Education

describe('Education', () => {
  it('renders the institution, degree and details', () => {
    render(<Education items={educationFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /education/i })).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Dhirubhai Ambani University' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('B.Tech in Information and Communication Technology'),
    ).toBeInTheDocument()
    expect(screen.getByText('Graduated with distinction.')).toBeInTheDocument()
    expect(screen.getByText(/Nov 2020 — May 2024/)).toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Education items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ------------------------------------------------------------ Responsibilities

describe('Responsibilities', () => {
  it('renders the role, organisation and bullets', () => {
    render(<Responsibilities items={responsibilitiesFixture} />)
    expect(
      screen.getByRole('heading', { level: 2, name: /responsibilit/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 3, name: 'Chairperson, IEEE Society DAU' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Dhirubhai Ambani University')).toBeInTheDocument()
    expect(screen.getByText('Led a 25+ member team.')).toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Responsibilities items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ---------------------------------------------------------------- Contact

describe('Contact', () => {
  it('renders the email link and every social link', () => {
    render(<Contact settings={baseSettings} />)
    expect(screen.getByRole('heading', { level: 2, name: /get in touch/i })).toBeInTheDocument()
    expect(document.querySelector('section#contact')).not.toBeNull()
    expect(screen.getByRole('link', { name: /pranavnarendrapatil/i })).toHaveAttribute(
      'href',
      'mailto:pranavnarendrapatil.2104@gmail.com',
    )
    expect(screen.getByRole('link', { name: /GitHub/i })).toHaveAttribute(
      'href',
      'https://github.com/PranavPatil-21',
    )
    expect(screen.getByRole('link', { name: /LinkedIn/i })).toBeInTheDocument()
  })

  it('renders a resume download link when resumePdf is set', () => {
    render(<Contact settings={baseSettings} />)
    expect(screen.getByRole('link', { name: /resume/i })).toHaveAttribute(
      'href',
      '/uploads/resume.pdf',
    )
  })

  it('hides the resume link when resumePdf is absent', () => {
    const { resumePdf: _omitted, ...withoutResume } = baseSettings
    render(<Contact settings={withoutResume as Settings} />)
    expect(screen.queryByRole('link', { name: /resume/i })).not.toBeInTheDocument()
  })

  it('renders no social links when socials is empty', () => {
    render(<Contact settings={{ ...baseSettings, socials: [] }} />)
    expect(screen.queryByRole('link', { name: /GitHub/i })).not.toBeInTheDocument()
    // The email link is not a social — it must survive an empty socials list.
    expect(screen.getByRole('link', { name: /pranavnarendrapatil/i })).toBeInTheDocument()
  })
})
