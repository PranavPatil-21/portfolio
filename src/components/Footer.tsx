import type { Settings } from '@/content'

export default function Footer({ settings }: { settings: Settings }) {
  return (
    <footer className="mt-24 border-t border-white/5 px-6 py-10 sm:px-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--foreground)]/55">
          © {new Date().getFullYear()} {settings.name}
        </p>
        <ul className="flex flex-wrap items-center gap-4">
          {settings.socials.map((social) => (
            <li key={social.url}>
              <a
                href={social.url}
                rel="noreferrer noopener"
                className="text-sm text-[var(--foreground)]/65 underline-offset-4 transition hover:text-[var(--foreground)] hover:underline focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:outline-none motion-reduce:transition-none"
              >
                {social.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
