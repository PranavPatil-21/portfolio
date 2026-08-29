import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '@/lib/markdown'

describe('renderMarkdown', () => {
  it('converts headings to heading elements', async () => {
    const html = await renderMarkdown('# Hello world\n\n## Subtitle')
    expect(html).toContain('<h1>Hello world</h1>')
    expect(html).toContain('<h2>Subtitle</h2>')
  })

  it('converts links to anchors', async () => {
    const html = await renderMarkdown('[Next.js](https://nextjs.org)')
    expect(html).toContain('<a href="https://nextjs.org">Next.js</a>')
  })

  it('converts fenced code blocks to pre/code', async () => {
    const html = await renderMarkdown('```ts\nconst x = 1\n```')
    expect(html).toContain('<pre>')
    expect(html).toContain('<code')
    expect(html).toContain('const x = 1')
  })

  it('renders emphasis and lists', async () => {
    const html = await renderMarkdown('- **bold** item\n- second')
    expect(html).toContain('<ul>')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('keeps safe inline HTML', async () => {
    const html = await renderMarkdown('<p>plain <em>html</em></p>')
    expect(html).toContain('<em>html</em>')
  })

  describe('sanitisation', () => {
    it('strips <script> tags entirely', async () => {
      const html = await renderMarkdown('hello\n\n<script>alert(1)</script>')
      expect(html).not.toContain('<script')
      expect(html).not.toContain('alert(1)')
    })

    it('strips on* event handler attributes', async () => {
      const html = await renderMarkdown('<img src="x" alt="a cat" onerror="alert(1)">')
      // The positive half matters: without it this passes even if the whole
      // element vanished, which would prove nothing about attribute stripping.
      expect(html).toContain('<img')
      expect(html).toContain('src="x"')
      expect(html).not.toContain('onerror')
      expect(html).not.toContain('alert(1)')
    })

    it('strips a javascript: href from raw HTML', async () => {
      const html = await renderMarkdown('<a href="javascript:alert(1)">click</a>')
      expect(html).not.toContain('javascript:')
      expect(html).toContain('click')
    })

    it('strips a javascript: href written as markdown link syntax', async () => {
      const html = await renderMarkdown('[click](javascript:alert)')
      expect(html).not.toContain('javascript:')
      expect(html).toContain('click')
    })

    it('strips iframes and style attributes', async () => {
      const html = await renderMarkdown('<iframe src="https://evil.example"></iframe>')
      expect(html).not.toContain('<iframe')
    })
  })
})
