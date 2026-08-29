import { describe, it, expect } from 'vitest'
import { themeToCssVars, readableTextOn, contrastRatio } from '../theme'

const theme = {
  accent: '#6c5ce7',
  background: '#0b0b12',
  foreground: '#f5f5f7',
  defaultMode: 'dark' as const,
}

describe('themeToCssVars', () => {
  it('maps all three colours onto CSS custom properties', () => {
    expect(themeToCssVars(theme)).toMatchObject({
      '--accent-dark': '#6c5ce7',
      '--background-dark': '#0b0b12',
      '--foreground-dark': '#f5f5f7',
    })
  })

  it('does not leak defaultMode into the CSS variables', () => {
    expect(Object.keys(themeToCssVars(theme))).not.toContain('--default-mode')
    expect(Object.values(themeToCssVars(theme))).not.toContain('dark')
    expect(Object.values(themeToCssVars(theme))).not.toContain('system')
  })

  it('reflects whatever colours the CMS supplies', () => {
    const vars = themeToCssVars({ ...theme, accent: '#ff0055' })
    expect(vars['--accent-dark']).toBe('#ff0055')
  })
})

describe('readableTextOn (WCAG AA on CMS-chosen accents)', () => {
  it('picks the higher-contrast option for any accent', () => {
    expect(readableTextOn('#000000')).toBe('#ffffff')
    expect(readableTextOn('#ffffff')).toBe('#000000')
    expect(readableTextOn('#a78bfa')).toBe('#000000') // light purple
    expect(readableTextOn('#4f31d9')).toBe('#ffffff') // deep purple
  })

  it('always clears the 4.5:1 AA threshold for normal text', () => {
    const accents = ['#6d4aff', '#7c5cff', '#a78bfa', '#4f31d9', '#e11d48', '#0ea5e9', '#22c55e', '#facc15']
    for (const accent of accents) {
      expect(contrastRatio(accent, readableTextOn(accent))).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('emits --accent-contrast so buttons stay readable without a code change', () => {
    const vars = themeToCssVars({
      accent: '#facc15', background: '#08080c', foreground: '#f4f4f7', defaultMode: 'dark',
    })
    expect(vars['--accent-contrast-dark']).toBe('#000000')
  })
})

describe('two-palette output', () => {
  const dark = {
    accent: '#ff8c42',
    background: '#0c0a09',
    foreground: '#f5f2ef',
    defaultMode: 'system' as const,
  }

  it('emits only the dark palette when no light palette is configured', () => {
    const vars = themeToCssVars(dark)
    expect(vars['--accent-dark']).toBe('#ff8c42')
    expect(vars['--accent-light']).toBeUndefined()
  })

  it('emits both palettes when a light one is configured', () => {
    const vars = themeToCssVars({
      ...dark,
      light: { accent: '#b03d09', background: '#fbfaf8', foreground: '#17130f' },
    })
    expect(vars['--accent-light']).toBe('#b03d09')
    expect(vars['--background-light']).toBe('#fbfaf8')
  })

  it('computes readable text per palette, not once for both', () => {
    // The whole reason light needs its own accent: the dark-mode orange scores
    // 2.22:1 as text on white. Each palette gets its own derived values.
    const vars = themeToCssVars({
      ...dark,
      light: { accent: '#b03d09', background: '#fbfaf8', foreground: '#17130f' },
    })
    expect(contrastRatio(vars['--accent-readable-dark'], '#0c0a09')).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(vars['--accent-readable-light'], '#fbfaf8')).toBeGreaterThanOrEqual(4.5)
  })
})
