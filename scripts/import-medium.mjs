#!/usr/bin/env node
/**
 * Pull one of your Medium posts down as an editable Markdown article.
 *
 * The importer already renders Medium posts on the site, but those stay tied to
 * Medium: only the ten most recent are in the feed, and a member-only post
 * exposes a preview rather than the text. Bringing a piece across makes it
 * permanent and fully yours — the local copy also wins de-duplication, so the
 * imported version disappears on its own.
 *
 *   node scripts/import-medium.mjs            # list what is in the feed
 *   node scripts/import-medium.mjs 1          # import the first post
 *
 * Writes content/articles/<slug>.md as a DRAFT so nothing publishes until you
 * have read it in /admin.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { XMLParser } from 'fast-xml-parser'
import TurndownService from 'turndown'

const settings = JSON.parse(readFileSync(new URL('../content/settings.json', import.meta.url)))
const handle = settings.features?.mediumHandle
if (!handle) {
  console.error('No mediumHandle in content/settings.json.')
  process.exit(1)
}

const res = await fetch(`https://medium.com/feed/@${handle}`, {
  signal: AbortSignal.timeout(15000),
})
if (!res.ok) {
  console.error(`Medium returned ${res.status} for @${handle}.`)
  process.exit(1)
}

const parsed = new XMLParser({ ignoreAttributes: false }).parse(await res.text())
const items = [].concat(parsed?.rss?.channel?.item ?? [])
if (!items.length) {
  console.error('The feed has no posts.')
  process.exit(1)
}

const pick = Number(process.argv[2])
if (!pick) {
  console.log(`\n@${handle} — ${items.length} post(s) in the feed:\n`)
  items.forEach((item, i) => console.log(`  ${i + 1}. ${item.title}`))
  console.log('\nRun again with a number to import, e.g. node scripts/import-medium.mjs 1\n')
  process.exit(0)
}

const item = items[pick - 1]
if (!item) {
  console.error(`No post ${pick}. There are ${items.length}.`)
  process.exit(1)
}

const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
// Medium wraps figures in markup Turndown turns into noise; keep the image and
// its caption, drop the scaffolding.
turndown.addRule('figure', {
  filter: 'figure',
  replacement: (_content, node) => {
    const img = node.querySelector?.('img')
    const caption = node.querySelector?.('figcaption')?.textContent?.trim() ?? ''
    if (!img) return caption ? `\n\n_${caption}_\n\n` : ''
    return `\n\n![${caption}](${img.getAttribute('src')})\n\n`
  },
})

const html = item['content:encoded'] ?? item.description ?? ''
const body = turndown.turndown(String(html)).replace(/\n{3,}/g, '\n\n').trim()

const link = String(item.link ?? '').split('?')[0]
const date = new Date(item.pubDate).toISOString().slice(0, 10)
const slug =
  String(item.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'imported-article'

const tags = [].concat(item.category ?? []).map(String)
const escape = (s) => String(s).replace(/"/g, '\\"')

const frontmatter = [
  '---',
  `title: "${escape(item.title)}"`,
  `date: "${date}"`,
  'draft: true',
  tags.length ? `tags:\n${tags.map((t) => `  - "${escape(t)}"`).join('\n')}` : null,
  // Keeps search engines crediting the Medium original, and is one of the
  // signals the merge uses to drop the imported duplicate.
  link ? `canonicalUrl: "${link}"` : null,
  '---',
]
  .filter(Boolean)
  .join('\n')

const path = new URL(`../content/articles/${slug}.md`, import.meta.url)
if (existsSync(path)) {
  console.error(`content/articles/${slug}.md already exists — not overwriting.`)
  process.exit(1)
}

writeFileSync(path, `${frontmatter}\n\n${body}\n`)
console.log(`\n✓ Wrote content/articles/${slug}.md (${body.length} chars, draft)`)
console.log('  Review it in /admin, then untick Draft to publish.\n')
