'use client'

import { useEffect, useRef, useState } from 'react'
import { SectionShell } from '@/components/ui/SectionShell'

export type Metric = {
  /** The figure exactly as it should read when the animation lands, e.g. "800K+". */
  value: string
  label: string
}

/**
 * Splits a display figure into the parts a count-up needs.
 *
 * The point is that the *string* is the source of truth, not a number plus a
 * format config. The owner types "800K+", "99.9%", "<2s" or "3×" into the CMS
 * and gets exactly that back — we only animate the digits in the middle and
 * replay the prefix and suffix around them verbatim.
 *
 * `decimals` is taken from the literal the owner wrote rather than inferred, so
 * "99.9%" counts through 12.3 → 99.9 instead of rounding through integers and
 * landing on a value ("100%") they never typed.
 */
export function parseMetric(value: string): {
  prefix: string
  suffix: string
  target: number
  decimals: number
} | null {
  const match = /^(\D*?)([\d,]+(?:\.\d+)?)(.*)$/.exec(value)
  if (!match) return null

  const [, prefix, digits, suffix] = match
  const target = Number(digits.replace(/,/g, ''))
  if (Number.isNaN(target)) return null

  const dot = digits.indexOf('.')
  return {
    prefix,
    suffix,
    target,
    decimals: dot === -1 ? 0 : digits.length - dot - 1,
  }
}

/**
 * Reads `prefers-reduced-motion` directly rather than via `motion/react`.
 *
 * This component is the one place where the reduced-motion branch changes what
 * text is on screen at first paint rather than just how it gets there, so it is
 * worth owning the query outright: no library media-query cache to warm up, and
 * the initial synchronous read is the value the first render commits.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!query) return
    const onChange = () => setReduced(query.matches)
    query.addEventListener?.('change', onChange)
    return () => query.removeEventListener?.('change', onChange)
  }, [])

  return reduced
}

/**
 * One figure. Counts from zero to its target the first time it is scrolled into
 * view, then stops observing.
 *
 * Two invariants hold whatever the animation does:
 *
 * 1. The **label** and an accessible reading of the final value are always in
 *    the DOM — the animated digits are `aria-hidden`, and the finished string
 *    is exposed once via a visually-hidden node, so a screen reader is never
 *    read a number that is still climbing.
 * 2. Under reduced motion, or when the string carries no digits to animate, the
 *    final value renders immediately with no timer started at all.
 */
function MetricFigure({ metric, reduced }: { metric: Metric; reduced: boolean }) {
  const parsed = parseMetric(metric.value)
  const animatable = !reduced && parsed !== null
  const ref = useRef<HTMLParagraphElement | null>(null)
  const [display, setDisplay] = useState(() =>
    animatable && parsed
      ? `${parsed.prefix}${(0).toFixed(parsed.decimals)}${parsed.suffix}`
      : metric.value,
  )

  useEffect(() => {
    if (!animatable || !parsed) return

    const node = ref.current
    let frame = 0
    let cancelled = false

    const run = () => {
      const start = performance.now()
      const duration = 1400

      const step = (now: number) => {
        if (cancelled) return
        const t = Math.min(1, (now - start) / duration)
        // Ease-out expo: fast off the line, settling rather than stopping.
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
        // Land on the owner's literal rather than a recomposed string. Digit
        // grouping ("1,200") cannot be reconstructed from the parsed number, so
        // the final frame must be the value as typed or the comma disappears.
        if (t === 1) {
          setDisplay(metric.value)
        } else {
          const current = (parsed.target * eased).toFixed(parsed.decimals)
          setDisplay(`${parsed.prefix}${current}${parsed.suffix}`)
        }
        if (t < 1) frame = requestAnimationFrame(step)
      }

      frame = requestAnimationFrame(step)
    }

    // No IntersectionObserver (jsdom, very old browsers) means we cannot know
    // when the figure is visible — counting immediately is strictly better than
    // leaving a zero on screen forever.
    if (!node || typeof IntersectionObserver === 'undefined') {
      run()
      return () => {
        cancelled = true
        cancelAnimationFrame(frame)
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          run()
        }
      },
      { threshold: 0.4 },
    )
    observer.observe(node)

    return () => {
      cancelled = true
      observer.disconnect()
      cancelAnimationFrame(frame)
    }
  }, [animatable, metric.value, parsed?.prefix, parsed?.suffix, parsed?.target, parsed?.decimals]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <li className="border-t border-[var(--hairline)] pt-6">
      <p
        ref={ref}
        data-testid="metric-value"
        aria-hidden={animatable ? 'true' : undefined}
        className="tabular text-5xl leading-none font-black tracking-tighter text-[var(--foreground)] sm:text-6xl md:text-7xl"
      >
        {display}
      </p>
      {animatable ? <span className="sr-only">{metric.value}</span> : null}
      <p className="mt-4 max-w-[26ch] font-mono text-[11px] leading-relaxed tracking-[0.12em] text-[var(--foreground)]/55 uppercase">
        {metric.label}
      </p>
    </li>
  )
}

/**
 * The outcomes, stated as numbers and nothing else.
 *
 * This is the loudest block on the page by design: it is the argument, and the
 * sections around it are the evidence. Returns `null` for an empty list so an
 * unfilled collection omits the section rather than shipping a bare heading.
 */
export function Metrics({ items }: { items: Metric[] }) {
  const reduced = usePrefersReducedMotion()

  if (items.length === 0) return null

  return (
    <SectionShell
      id="metrics"
      eyebrow="Measured"
      title="Impact"
      index="01 / IMPACT"
      subtitle="What the work moved, in the numbers the business kept score with."
    >
      <ul className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <MetricFigure key={`${item.value}-${item.label}`} metric={item} reduced={reduced} />
        ))}
      </ul>
    </SectionShell>
  )
}

export default Metrics
