import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeStringify from 'rehype-stringify'

/**
 * Markdown → HTML for article and project bodies.
 *
 * Content reaches this function from two places: the CMS (trusted-ish, but a
 * compromised GitHub token would make it untrusted) and the Medium importer
 * (third-party HTML, definitively untrusted). Both are treated as hostile.
 *
 * Order matters and is load-bearing:
 *
 *   remark-rehype({ allowDangerousHtml: true })  keeps raw HTML nodes in the tree
 *   rehype-raw                                   re-parses them into real elements
 *   rehype-sanitize                              prunes against the GitHub allowlist
 *   rehype-stringify                             serialises — WITHOUT allowDangerousHtml
 *
 * Sanitising after `rehype-raw` is what makes the allowlist meaningful: raw HTML
 * that never became tree nodes could not be inspected. And `rehype-stringify`
 * must stay bare — passing `allowDangerousHtml` there would re-emit anything the
 * sanitiser had not already removed, defeating the whole pipeline.
 *
 * The default GitHub schema strips `<script>`, drops every `on*` handler, and
 * allows only http/https/mailto-style protocols on `href`, so a `javascript:`
 * URL loses its attribute while the link text survives.
 */
export async function renderMarkdown(md: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRaw)
    .use(rehypeSanitize)
    .use(rehypeStringify)
    .process(md)

  return String(file)
}

/**
 * Tailwind classes for a rendered article body.
 *
 * Kept here rather than in a plugin: `@tailwindcss/typography` is not a
 * dependency of this project, and the body styling is small enough that an
 * explicit set of child selectors is clearer than an opaque preset — and easier
 * to keep aligned with the CMS-driven `--accent` / `--foreground` tokens.
 */
export const proseClassName = [
  'max-w-none text-[1.0625rem] leading-8 text-[color:var(--foreground)]/85',
  '[&>*+*]:mt-6',
  '[&_h2]:mt-14 [&_h2]:mb-4 [&_h2]:scroll-mt-24 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-[color:var(--foreground)]',
  '[&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:scroll-mt-24 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight [&_h3]:text-[color:var(--foreground)]',
  '[&_h4]:mt-8 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-[color:var(--foreground)]',
  '[&_p]:text-pretty',
  '[&_a]:font-medium [&_a]:text-[color:var(--accent-readable)] [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-[color:var(--accent)]/40 hover:[&_a]:decoration-[color:var(--accent)]',
  '[&_strong]:font-semibold [&_strong]:text-[color:var(--foreground)]',
  '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_li]:mt-2 [&_li]:pl-1',
  '[&_li::marker]:text-[color:var(--accent-readable)]/70',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-[color:var(--accent)]/50 [&_blockquote]:pl-5 [&_blockquote]:italic [&_blockquote]:text-[color:var(--foreground)]/70',
  '[&_code]:rounded [&_code]:bg-[color:var(--foreground)]/8 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.875em]',
  '[&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:border [&_pre]:border-[color:var(--foreground)]/10 [&_pre]:bg-[color:var(--foreground)]/5 [&_pre]:p-5 [&_pre]:text-sm [&_pre]:leading-7',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-[0.9375em]',
  '[&_img]:rounded-xl [&_img]:border [&_img]:border-[color:var(--foreground)]/10',
  '[&_hr]:my-12 [&_hr]:border-[color:var(--foreground)]/12',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-[0.9375em]',
  '[&_th]:border-b [&_th]:border-[color:var(--foreground)]/20 [&_th]:pb-2 [&_th]:font-semibold',
  '[&_td]:border-b [&_td]:border-[color:var(--foreground)]/10 [&_td]:py-2',
].join(' ')

/**
 * Renders sanitised markdown as a styled block. Server-only — the HTML has
 * already been through the allowlist above, which is what makes
 * `dangerouslySetInnerHTML` acceptable here and nowhere else.
 */
export async function MarkdownBody({
  content,
  className,
}: {
  content: string
  className?: string
}) {
  const html = await renderMarkdown(content)
  return (
    <div
      className={className ? `${proseClassName} ${className}` : proseClassName}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
