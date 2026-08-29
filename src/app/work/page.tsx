import type { Metadata } from 'next'
import Link from 'next/link'
import { getNativeArticles, getProjects, getSettings } from '@/content'
import type { Project } from '@/content'
import Tag from '@/components/ui/Tag'
import Reveal from '@/components/ui/Reveal'
import FlowDiagram from '@/components/FlowDiagram'
import { formatProjectDate } from './date'

/**
 * Grouped, not filtered.
 *
 * The home page owns the interactive cut of this work; the index's job is to be
 * the complete, linkable, server-rendered list — the thing you send someone.
 * Three static groups beat a client filter that hides eight of nine entries
 * from anyone who arrives without JavaScript.
 */
const GROUPS = [
  { key: 'ai', label: 'AI', blurb: 'Systems where the model is the product.' },
  {
    key: 'systems',
    label: 'Systems',
    blurb: 'Backend platforms built for throughput and correctness.',
  },
  {
    key: 'product',
    label: 'Product',
    blurb: 'Customer journeys shaped by policy, risk and trade-offs.',
  },
] as const

export function generateMetadata(): Metadata {
  const settings = getSettings()
  return {
    title: 'Work',
    description: `Case studies by ${settings.name} — what was broken, what was decided, and what changed.`,
    alternates: { canonical: '/work' },
  }
}

function CaseStudyRow({ project, index }: { project: Project; index: number }) {
  /*
   * Deliberately not one big <Link>. These rows carry a pipeline diagram and a
   * metric strip, and burying those inside an anchor makes a link whose
   * accessible name is the entire card. The heading carries the link and a
   * stretched pseudo-element makes the whole row clickable.
   */
  return (
    <li>
      <Reveal delay={index * 0.04}>
        <article className="group relative -mx-4 rounded-xl px-4 py-6 transition-colors duration-300 hover:bg-[var(--surface)] motion-reduce:transition-none">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span
              aria-hidden="true"
              className="tabular font-mono text-[11px] text-[var(--subtle)] transition-colors duration-300 group-hover:text-[var(--accent-readable)] motion-reduce:transition-none"
            >
              {String(index + 1).padStart(2, '0')}
            </span>
            <h3 className="text-lg font-semibold tracking-tight text-[var(--foreground)] transition-colors duration-300 group-hover:text-[var(--accent-readable)] motion-reduce:transition-none">
              <Link href={`/work/${project.slug}`} className="after:absolute after:inset-0">
                {project.title}
              </Link>
            </h3>
            <time className="eyebrow tabular" dateTime={project.date}>
              {formatProjectDate(project.date)}
            </time>
          </div>

          {project.context ? (
            <p className="mt-1 text-xs text-[var(--subtle)]">{project.context}</p>
          ) : null}

          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-pretty text-[var(--muted)]">
            {project.summary}
          </p>

          {/* The numbers, where the work has them — the fastest thing to scan. */}
          {project.metrics.length > 0 ? (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {project.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`}>
                  <dd className="tabular text-xl leading-none font-semibold tracking-tight text-[var(--accent-readable)]">
                    {metric.value}
                  </dd>
                  <dt className="mt-1 text-xs text-[var(--subtle)]">{metric.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          {/* The shape of the system, where the case study describes one. */}
          {project.flow.length > 1 ? (
            <div className="mt-5">
              <FlowDiagram nodes={project.flow} />
            </div>
          ) : null}

          {project.tech.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {project.tech.slice(0, 6).map((item) => (
                <Tag key={item}>{item}</Tag>
              ))}
            </div>
          ) : null}

          <p className="mt-5 flex items-center gap-2 text-[13px] text-[var(--accent-readable)]">
            Read case study
            <span
              aria-hidden="true"
              className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none"
            >
              →
            </span>
          </p>
        </article>
      </Reveal>
    </li>
  )
}

export default function WorkPage() {
  const projects = getProjects()

  const groups = GROUPS.map((group) => ({
    ...group,
    items: projects.filter((p) => p.category === group.key),
  })).filter((group) => group.items.length > 0)

  return (
    <>
      <main id="main" className="mx-auto w-full max-w-3xl px-6 pt-10 pb-24">
      <header className="max-w-2xl">
        <p className="eyebrow">Case studies</p>
        <h1 className="display mt-4 text-balance text-[var(--foreground)]">Work</h1>
        <p className="mt-5 text-lg leading-8 text-pretty text-[var(--muted)]">
          Nine pieces of work, each written up the way it actually went — the problem,
          the approach, the decision that mattered, and what changed afterwards.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="mt-14 text-[var(--muted)]">Nothing published yet.</p>
      ) : (
        <div className="mt-16 space-y-16">
          {groups.map((group) => (
            <section key={group.key} aria-labelledby={`work-${group.key}`}>
              <div className="border-b border-[var(--hairline)] pb-4">
                <h2
                  id={`work-${group.key}`}
                  className="heading text-[var(--foreground)]"
                >
                  {group.label}
                </h2>
                <p className="mt-2 text-sm text-[var(--subtle)]">{group.blurb}</p>
              </div>
              <ul className="mt-2 divide-y divide-[var(--hairline)]">
                {group.items.map((project, i) => (
                  <CaseStudyRow key={project.slug} project={project} index={i} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="mt-20 border-t border-[var(--hairline)] pt-8">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--accent-readable)] underline underline-offset-4 decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] hover:decoration-[var(--accent)]"
        >
          ← Back home
        </Link>
      </p>
    </main>
    </>
  )
}
