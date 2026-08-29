import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getProjects, getSettings } from '@/content'
import type { Project } from '@/content'
import { MarkdownBody } from '@/lib/markdown'
import FlowDiagram from '@/components/FlowDiagram'
import Card from '@/components/ui/Card'
import Tag from '@/components/ui/Tag'
import { formatProjectDate } from '../date'

type Params = { slug: string }

/**
 * Case-study labels.
 *
 * The narrative order is fixed — problem, approach, decision, outcome — because
 * that is the order a reader assessing product judgement wants it in. Each
 * section renders only when the field carries content, so a lighter entry reads
 * as deliberately short rather than as a form with gaps in it.
 */
const NARRATIVE = [
  { key: 'problem', label: 'Problem' },
  { key: 'approach', label: 'Approach' },
  { key: 'decision', label: 'The decision' },
  { key: 'outcome', label: 'Outcome' },
] as const

function findProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug)
}

export function generateStaticParams(): Params[] {
  return getProjects().map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const project = findProject(slug)
  if (!project) return { title: 'Case study not found' }

  const settings = getSettings()

  return {
    // The root layout appends the owner's name via its title template — adding
    // it here too would ship "Title · Pranav Patil · Pranav Patil".
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      type: 'article',
      title: project.title,
      description: project.summary,
      siteName: settings.name,
      ...(project.cover ? { images: [{ url: project.cover }] } : {}),
    },
  }
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const all = getProjects()
  const index = all.findIndex((p) => p.slug === slug)

  if (index === -1) notFound()

  const project = all[index]
  // Wrapping rather than clamping: at the ends the reader is offered the other
  // end of the shelf instead of a dead control.
  const hasNeighbours = all.length > 1
  const prev = all[(index - 1 + all.length) % all.length]
  const next = all[(index + 1) % all.length]

  const narrative = NARRATIVE.map((s) => ({ ...s, text: project[s.key] })).filter(
    (s): s is (typeof NARRATIVE)[number] & { text: string } => Boolean(s.text),
  )

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-6 py-20 sm:py-28">
      <p className="mb-10">
        <Link
          href="/work"
          className="eyebrow transition-colors hover:text-[var(--accent-readable)]"
        >
          ← All work
        </Link>
      </p>

      <article>
        <header className="border-b border-[var(--hairline)] pb-10">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow rounded-full bg-[var(--accent-soft)] px-3 py-1 text-[var(--accent-readable)]">
              {project.category}
            </span>
            <time className="eyebrow tabular" dateTime={project.date}>
              {formatProjectDate(project.date)}
            </time>
          </div>

          <h1 className="display mt-5 text-balance text-[var(--foreground)]">
            {project.title}
          </h1>

          <p className="mt-6 text-lg leading-8 text-pretty text-[var(--muted)]">
            {project.summary}
          </p>

          {project.context || project.role ? (
            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              {project.context ? (
                <div>
                  <dt className="eyebrow">Context</dt>
                  <dd className="mt-1.5 text-sm text-[var(--muted)]">{project.context}</dd>
                </div>
              ) : null}
              {project.role ? (
                <div>
                  <dt className="eyebrow">Role</dt>
                  <dd className="mt-1.5 text-sm text-[var(--muted)]">{project.role}</dd>
                </div>
              ) : null}
            </dl>
          ) : null}
        </header>

        {project.metrics.length > 0 ? (
          <section data-testid="case-study-metrics" className="mt-10">
            <Card className="grid gap-8 p-7 sm:grid-cols-3">
              {project.metrics.map((metric) => (
                <div key={`${metric.value}-${metric.label}`}>
                  <p className="tabular text-3xl leading-none font-semibold tracking-tight text-[var(--accent-readable)]">
                    {metric.value}
                  </p>
                  <p className="mt-2 text-sm leading-snug text-[var(--subtle)]">
                    {metric.label}
                  </p>
                </div>
              ))}
            </Card>
          </section>
        ) : null}

        {/*
          The pipeline, where the case study describes one. A diagram carries a
          system's shape faster than a paragraph can, and these case studies are
          mostly about how data moves.
        */}
        {project.flow.length > 1 ? (
          <div className="mt-10">
            <FlowDiagram nodes={project.flow} label="How it flows" />
          </div>
        ) : null}

        {narrative.length > 0 ? (
          <div className="mt-14 space-y-12">
            {narrative.map((section) => (
              <section key={section.key}>
                <h2 className="heading text-[var(--foreground)]">{section.label}</h2>
                {/* Plain text by contract — the structured fields are not markdown. */}
                <p className="mt-4 text-[1.0625rem] leading-8 text-pretty text-[var(--muted)]">
                  {section.text}
                </p>
              </section>
            ))}
          </div>
        ) : null}

        {project.body ? (
          <div
            className={
              narrative.length > 0 || project.metrics.length > 0
                ? 'mt-14 border-t border-[var(--hairline)] pt-12'
                : 'mt-12'
            }
          >
            <MarkdownBody content={project.body} />
          </div>
        ) : null}

        {project.tech.length > 0 ? (
          <section className="mt-14 border-t border-[var(--hairline)] pt-10">
            <h2 className="eyebrow">Built with</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {project.tech.map((item) => (
                <li key={item}>
                  <Tag>{item}</Tag>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {project.repo || project.demo ? (
          <p className="mt-8 flex flex-wrap gap-6">
            {project.repo ? (
              <a
                href={project.repo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent-readable)] underline underline-offset-4 decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] hover:decoration-[var(--accent)]"
              >
                Source ↗
              </a>
            ) : null}
            {project.demo ? (
              <a
                href={project.demo}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-[var(--accent-readable)] underline underline-offset-4 decoration-[color-mix(in_oklab,var(--accent)_40%,transparent)] hover:decoration-[var(--accent)]"
              >
                Live demo ↗
              </a>
            ) : null}
          </p>
        ) : null}
      </article>

      {hasNeighbours ? (
        <nav
          aria-label="Case studies"
          className="mt-20 grid gap-4 border-t border-[var(--hairline)] pt-10 sm:grid-cols-2"
        >
          <Link
            data-testid="case-study-prev"
            href={`/work/${prev.slug}`}
            className="group rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5 transition-colors hover:border-[color-mix(in_oklab,var(--accent)_38%,transparent)]"
          >
            <span className="eyebrow">← Previous</span>
            <span className="mt-2 block text-sm font-medium text-[var(--foreground)]">
              {prev.title}
            </span>
          </Link>
          <Link
            data-testid="case-study-next"
            href={`/work/${next.slug}`}
            className="group rounded-xl border border-[var(--hairline)] bg-[var(--surface)] p-5 transition-colors hover:border-[color-mix(in_oklab,var(--accent)_38%,transparent)] sm:text-right"
          >
            <span className="eyebrow">Next →</span>
            <span className="mt-2 block text-sm font-medium text-[var(--foreground)]">
              {next.title}
            </span>
          </Link>
        </nav>
      ) : null}
    </main>
  )
}
