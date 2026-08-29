import type { Metadata } from 'next'
import { Inter, Playfair_Display, Geist_Mono } from 'next/font/google'
import './globals.css'

import { getSettings } from '@/content'
import { themeToCssVars } from '@/lib/theme'
import JsonLd from '@/components/JsonLd'
import SiteHeader from '@/components/SiteHeader'
import { getNavSections } from '@/lib/nav'
import { getAllArticles } from '@/lib/articles'

const inter = Inter({ variable: '--font-inter', subsets: ['latin'], display: 'swap' })
/* Playfair carries the outlined-italic headings; only the italic face is used. */
const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  style: ['italic'],
  weight: ['400', '500'],
  display: 'swap',
})
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

/**
 * Every metadata value comes from `content/settings.json`, so the owner edits
 * the page title, description and social preview text from `/admin` — no code
 * change, and no risk of the deployed metadata drifting from the visible copy.
 */
export function generateMetadata(): Metadata {
  const { seo, name, bio } = getSettings()
  return {
    metadataBase: new URL(siteUrl),
    title: { default: seo.title, template: `%s · ${name}` },
    description: seo.description,
    openGraph: {
      type: 'website',
      title: seo.title,
      description: seo.description,
      siteName: name,
      url: siteUrl,
    },
    twitter: { card: 'summary_large_image', title: seo.title, description: seo.description },
    alternates: { canonical: siteUrl },
  }
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const settings = getSettings()
  const sections = await getNavSections()
  const showWriting = (await getAllArticles()).length > 0

  return (
    <html
      lang="en"
      /*
       * The boot script below sets `data-theme` on this element before React
       * hydrates, so the server markup and the client DOM legitimately differ
       * by that one attribute. Suppressing here is the intended escape hatch —
       * the alternative is either a hydration error on every load or a flash of
       * the wrong theme, and neither is acceptable.
       */
      suppressHydrationWarning
      // The CMS-chosen palette is injected as CSS custom properties here, at the
      // root, so every derived design token downstream resolves against it.
      style={themeToCssVars(settings.theme) as React.CSSProperties}
      className={`${inter.variable} ${playfair.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/*
          Runs before first paint, so the correct theme is painted once rather
          than painted wrong and corrected. Deliberately duplicates the logic in
          `ThemeToggle.resolveTheme` — React is not available this early, and a
          flash of the wrong background is the one bug a theme switch cannot
          have. Kept to a few lines precisely so the duplication stays checkable.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=localStorage.getItem('theme')||'system';var d=m==='system'?(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark'):m;document.documentElement.dataset.theme=d;}catch(e){}})()`,
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-[var(--background)] text-[var(--foreground)]">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:rounded-full focus:bg-[var(--accent)] focus:px-4 focus:py-2 focus:text-[var(--accent-contrast)]"
        >
          Skip to content
        </a>
        <JsonLd settings={settings} />
        <SiteHeader settings={settings} showWriting={showWriting} sections={sections} />
        {children}
      </body>
    </html>
  )
}
