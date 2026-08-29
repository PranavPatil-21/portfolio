import type { Settings } from '@/content'

/**
 * Translates the CMS-editable theme block into the CSS custom properties the
 * design system is built on.
 *
 * The returned object is spread straight onto a `style` prop (on `<html>`), so
 * the owner can change the palette from `/admin` without a single code change —
 * `globals.css` maps these three variables onto Tailwind theme tokens, which
 * means every `bg-background` / `text-foreground` / `text-accent` utility on the
 * site resolves against whatever they picked.
 *
 * `defaultMode` is deliberately not emitted: it selects a colour scheme, it is
 * not itself a colour.
 */
export function themeToCssVars(theme: Settings['theme']): Record<string, string> {
  return {
    '--accent': theme.accent,
    '--background': theme.background,
    '--foreground': theme.foreground,
    '--accent-contrast': readableTextOn(theme.accent),
    '--accent-readable': readableAccentOn(theme.accent, theme.background),
  }
}

const AA_NORMAL_TEXT = 4.5

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')}`
}

/**
 * Nudges the accent toward the readable end of the scale until it clears AA
 * against the given background, and returns the first shade that does.
 *
 * The accent is a *brand* colour chosen for how it looks as a fill; using that
 * same value for small text frequently fails contrast — `#6d4aff` on a near
 * black background is only 3.87:1. Rather than forbidding the owner from
 * picking colours they like, we keep their accent for fills and derive a
 * readable sibling for text.
 *
 * Returns the closest shade that passes; if even pure white or black cannot
 * (impossible for real colours, but the loop is bounded), the last computed
 * value is returned rather than looping forever.
 */
export function readableAccentOn(accent: string, background: string): string {
  if (contrastRatio(accent, background) >= AA_NORMAL_TEXT) return accent

  // Move away from the background: lighten on dark backgrounds, darken on light.
  const target: [number, number, number] =
    luminance(background) < 0.5 ? [255, 255, 255] : [0, 0, 0]
  const start = hexToRgb(accent)

  let candidate = accent
  for (let step = 1; step <= 20; step++) {
    const t = step / 20
    candidate = rgbToHex([
      start[0] + (target[0] - start[0]) * t,
      start[1] + (target[1] - start[1]) * t,
      start[2] + (target[2] - start[2]) * t,
    ])
    if (contrastRatio(candidate, background) >= AA_NORMAL_TEXT) return candidate
  }
  return candidate
}

/** Relative luminance per WCAG 2.1. */
function luminance(hex: string): number {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

export function contrastRatio(a: string, b: string): number {
  const [l1, l2] = [luminance(a), luminance(b)]
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

/**
 * Picks black or white for text sitting on `background`, whichever has more
 * contrast.
 *
 * This is computed rather than hardcoded because the accent colour is
 * CMS-editable: the owner can pick any colour from `/admin`, and a fixed
 * `text-white` on a button silently fails WCAG AA as soon as they choose
 * something light. Deriving it means the site stays accessible for every
 * colour they might pick, with no code change — which is the whole promise of
 * the project applied to accessibility rather than just content.
 */
export function readableTextOn(background: string): string {
  return contrastRatio(background, '#ffffff') >= contrastRatio(background, '#000000')
    ? '#ffffff'
    : '#000000'
}
