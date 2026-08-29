import type { ReactNode } from 'react'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

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

import { Experience } from '../Experience'
import { Projects } from '../Projects'
import { Skills } from '../Skills'
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
    bullets: ['Architected a Kafka-based lending billing engine.'],
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
    body: 'long body text that must not be rendered on the card',
    tech: ['C++', 'Cryptography'],
    repo: 'https://github.com/PranavPatil-21/aes',
    demo: 'https://example.com/demo',
    cover: '/uploads/aes.png',
    coverAlt: 'A double pendulum trace',
    featured: true,
    date: '2023-09',
    order: 1,
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
  it('renders each role, company and bullet', () => {
    render(<Experience items={experienceFixture} />)
    expect(screen.getByRole('heading', { level: 2, name: /experience/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: /^Software Engineer$/ })).toBeInTheDocument()
    expect(screen.getAllByText('Wio Bank PJSC').length).toBe(2)
    expect(
      screen.getByText('Architected a Kafka-based lending billing engine.'),
    ).toBeInTheDocument()
  })

  it('labels a current role as Present and a finished role with its end date', () => {
    render(<Experience items={experienceFixture} />)
    expect(screen.getByText(/Sep 2024 — Present/)).toBeInTheDocument()
    expect(screen.getByText(/Feb 2024 — Aug 2024/)).toBeInTheDocument()
  })

  it('returns null for an empty array', () => {
    const { container } = render(<Experience items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

// ---------------------------------------------------------------- Projects

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

  it('returns null for an empty array', () => {
    const { container } = render(<Skills groups={[]} />)
    expect(container).toBeEmptyDOMElement()
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
