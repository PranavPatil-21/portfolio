import type { Settings } from '@/content'

/**
 * A colophon at the foot of the content column.
 *
 * Deliberately small. The rail already carries the name, the résumé and every
 * social link and stays on screen throughout, so repeating them at full size
 * here would be noise rather than a second chance to convert.
 */
export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-16 border-t border-[var(--hairline)] pt-8 pb-16">
      <p className="max-w-md text-[13px] leading-relaxed text-[var(--subtle)]">
        Built with Next.js and Tailwind, and written in a browser — every word on
        this page is editable without touching the code.
      </p>
      <p className="mt-4 font-mono text-[11px] tracking-[0.14em] text-[var(--subtle)] uppercase">
        © {new Date().getFullYear()} {settings.name}
      </p>
    </footer>
  )
}
