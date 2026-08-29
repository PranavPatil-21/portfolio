import { describe, it, expect } from 'vitest'
import { themeToCssVars } from '../theme'

const theme = {
  accent: '#6c5ce7',
  background: '#0b0b12',
  foreground: '#f5f5f7',
  defaultMode: 'dark' as const,
}

describe('themeToCssVars', () => {
  it('maps all three colours onto CSS custom properties', () => {
    expect(themeToCssVars(theme)).toEqual({
      '--accent': '#6c5ce7',
      '--background': '#0b0b12',
      '--foreground': '#f5f5f7',
    })
  })

  it('does not leak defaultMode into the CSS variables', () => {
    expect(Object.keys(themeToCssVars(theme))).toHaveLength(3)
  })

  it('reflects whatever colours the CMS supplies', () => {
    const vars = themeToCssVars({ ...theme, accent: '#ff0055' })
    expect(vars['--accent']).toBe('#ff0055')
  })
})
