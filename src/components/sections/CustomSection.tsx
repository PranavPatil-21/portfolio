import type { ComponentType } from 'react'
import type { CustomItem, CustomSection as CustomSectionData } from '@/content/schemas'
import { SectionShell } from '@/components/ui/SectionShell'
import { CardsLayout } from './layouts/CardsLayout'
import { TimelineLayout } from './layouts/TimelineLayout'
import { ListLayout } from './layouts/ListLayout'
import { LogoGridLayout } from './layouts/LogoGridLayout'

export type CustomLayoutProps = { items: CustomItem[] }

/**
 * Lookup rather than a `switch` with a `default:` — the fallback is then a
 * structural property of the record (`?? CardsLayout`) instead of a branch that
 * has to be kept in step with the enum.
 */
const LAYOUTS: Record<string, ComponentType<CustomLayoutProps>> = {
  cards: CardsLayout,
  timeline: TimelineLayout,
  list: ListLayout,
  'logo-grid': LogoGridLayout,
}

/**
 * Renders an owner-defined section — Talks, Awards, Certifications, whatever the
 * CMS invents next — in one of four fixed layouts.
 *
 * The `layout` value is schema-constrained, but published content can drift ahead
 * of a deploy (an editor picks a layout a newer schema added). An unrecognised
 * value degrades to `cards` rather than crashing the page.
 */
export function CustomSection({ section }: { section: CustomSectionData }) {
  if (section.items.length === 0) return null

  const Layout = LAYOUTS[section.layout] ?? CardsLayout

  return (
    <SectionShell
      id={`custom:${section.slug}`}
      title={section.title}
      subtitle={section.body || undefined}
    >
      <Layout items={section.items} />
    </SectionShell>
  )
}

export default CustomSection
