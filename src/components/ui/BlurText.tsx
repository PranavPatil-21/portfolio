'use client'

import { Fragment, useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'

/**
 * Reveals a paragraph word by word, each word rising out of a blur.
 *
 * Words wrapped in *asterisks* are emphasised in the accent colour, which lets
 * copy carry its own emphasis from the CMS without any markup — the owner types
 * `*40%*` in a text field and it highlights.
 *
 * ## Why this renders plain text first
 *
 * `whileInView` starts the element at its `initial` state, and that state is
 * serialised into the *server* HTML — every word ships as
 * `style="opacity:0;filter:blur(8px)"`. The reveal then depends on an
 * `IntersectionObserver` that only exists once JavaScript has run.
 *
 * The failure that follows is severe and silent: with JavaScript disabled, or
 * in any environment without `IntersectionObserver`, the observer meant to
 * reveal the text never exists, and the paragraph stays invisible forever. The
 * page looks blank where its most important copy should be.
 *
 * So the server, and the first client paint, render ordinary visible text. The
 * animated version is swapped in only once the client has confirmed it can
 * finish what it starts. The cost is that the reveal begins after hydration
 * rather than at first paint — on a slow connection the plain paragraph shows
 * briefly first. Visible text beats invisible text.
 */
export function BlurText({
  text,
  className = '',
  stagger = 0.022,
  delay = 0,
  as: Tag = 'p',
}: {
  text: string
  className?: string
  stagger?: number
  delay?: number
  as?: 'p' | 'span' | 'div'
}) {
  const reduced = useReducedMotion()
  const [canAnimate, setCanAnimate] = useState(false)

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    setCanAnimate(true)
  }, [])

  const words = text.split(' ')
  const plain = words.map(stripMarks).join(' ')

  if (reduced || !canAnimate) {
    return <Tag className={className}>{plain}</Tag>
  }

  return (
    <Tag className={className}>
      {words.map((word, i) => {
        const emphasised = word.includes('*')
        return (
          /*
           * The separating space is a text node BETWEEN the spans, never inside
           * one. Whitespace at the edge of an `inline-block` collapses, so a
           * space rendered inside the span disappears and the paragraph runs
           * together into one unreadable word.
           */
          <Fragment key={`${word}-${i}`}>
            <motion.span
              className={emphasised ? 'inline-block text-[var(--accent-readable)]' : 'inline-block'}
              initial={{ opacity: 0, y: 14, filter: 'blur(8px)' }}
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.55,
                delay: delay + i * stagger,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {stripMarks(word)}
            </motion.span>
            {i < words.length - 1 ? ' ' : null}
          </Fragment>
        )
      })}
    </Tag>
  )
}

function stripMarks(word: string): string {
  return word.replace(/\*/g, '')
}

export default BlurText
