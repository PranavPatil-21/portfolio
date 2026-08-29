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
  }
}
