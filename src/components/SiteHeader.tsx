'use client'

import { usePathname } from 'next/navigation'
import type { Settings } from '@/content'
import TopBar from '@/components/TopBar'

/**
 * The header, for every route.
 *
 * Mounted once in the root layout rather than per page. Doing it per page meant
 * `/work/[slug]` and `/articles/[slug]` — the two routes a reader is most likely
 * to arrive on from search — had no navigation at all, and every new route would
 * have started the same way. The variant is derived from the path so the bar is
 * transparent over the home page's opening screen and opaque everywhere else,
 * where content begins immediately beneath it.
 */
export default function SiteHeader({
  settings,
  showWriting,
  sections,
}: {
  settings: Settings
  showWriting: boolean
  sections?: { id: string; label: string }[]
}) {
  const pathname = usePathname()
  const isHome = pathname === '/'

  return (
    <TopBar
      settings={settings}
      variant={isHome ? 'home' : 'sub'}
      showWriting={showWriting}
      // In-page section anchors only make sense on the page that has them.
      sections={isHome ? sections : undefined}
    />
  )
}
