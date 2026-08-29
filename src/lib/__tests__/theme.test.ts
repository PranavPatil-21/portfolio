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
      '--accent': '#6c5ce7',
      '--background': '#0b0b12',
      '--foreground': '#f5f5f7',
    })
  })

  it('does not leak defaultMode into the CSS variables', () => {
    expect(Object.keys(themeToCssVars(theme))).not.toContain('--default-mode')
    expect(JSON.stringify(themeToCssVars(theme))).not.toContain('dark')
  })

  it('reflects whatever colours the CMS supplies', () => {
    const vars = themeToCssVars({ ...theme, accent: '#ff0055' })
    expect(vars['--accent']).toBe('#ff0055')
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
    expect(vars['--accent-contrast']).toBe('#000000')
  })
})
