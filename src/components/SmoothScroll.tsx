'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/**
 * Lenis smooth scrolling, driven off the GSAP ticker.
 *
 * Two independent rAF loops (one Lenis, one GSAP) produce visible drift between
 * the scroll position and anything ScrollTrigger drives from it, because they
 * tick in an undefined order within the same frame. Making GSAP's ticker the
 * single clock removes the race: Lenis advances, then ScrollTrigger reads the
 * position it just wrote, every frame, in that order.
 *
 * Renders nothing — it is a side effect with a component's lifecycle.
 */
export default function SmoothScroll() {
  useEffect(() => {
    // Hijacking the scroll is precisely what `prefers-reduced-motion` exists to
    // prevent: the eased catch-up is vestibular-triggering and it disables the
    // OS's own scroll behaviour. Don't initialise at all — degrade to native.
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return
    }

    gsap.registerPlugin(ScrollTrigger)

    // `html { scroll-behavior: smooth }` in globals.css fights Lenis: the
    // browser eases the same scroll Lenis is already easing, and anchor jumps
    // stutter. Lenis ships a stylesheet for this; injecting the two rules that
    // matter keeps the fix scoped to the lifetime of this component and avoids
    // a CSS import in a file that is also loaded by the test runner.
    const style = document.createElement('style')
    style.dataset.lenis = 'true'
    style.textContent = `
      html.lenis, html.lenis body { height: auto; }
      html.lenis { scroll-behavior: auto !important; }
      .lenis.lenis-stopped { overflow: hidden; }
    `
    document.head.appendChild(style)
    document.documentElement.classList.add('lenis')

    const lenis = new Lenis({
      duration: 1.1,
      // Expo-out: fast departure, long settle. Matches --ease-out-expo so the
      // scroll feels like the same material as the section reveals.
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch scrolling is already smooth and momentum-driven natively; taking
      // it over makes the page feel detached from the finger.
      syncTouch: false,
    })

    const onScroll = () => ScrollTrigger.update()
    lenis.on('scroll', onScroll)

    // GSAP's ticker reports elapsed time in seconds; Lenis wants milliseconds.
    // Feeding it seconds makes the page look frozen rather than smooth.
    const raf = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)

    // Lag smoothing rebases the clock after a slow frame, which desynchronises
    // Lenis from the real scroll position and shows up as a jump.
    gsap.ticker.lagSmoothing(0)

    return () => {
      gsap.ticker.remove(raf)
      gsap.ticker.lagSmoothing(500, 33)
      lenis.off('scroll', onScroll)
      lenis.destroy()
      document.documentElement.classList.remove('lenis')
      style.remove()
    }
  }, [])

  return null
}
