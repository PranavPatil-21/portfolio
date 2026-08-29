import { test, expect } from '@playwright/test'

/**
 * The spec requires that nothing readable depends on JavaScript. With JS
 * disabled the scroll-reveal observers never run, so this is the sharpest
 * available test of that rule.
 */
test('site is fully readable without JavaScript', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pranav Patil')
  await expect(page.getByText('Wio Bank').first()).toBeVisible()
  await expect(page.getByText(/Splitwise Backend Clone/).first()).toBeVisible()
  await expect(page.getByText(/Dhirubhai Ambani University/).first()).toBeVisible()

  const links = await page.getByRole('link').count()
  expect(links).toBeGreaterThan(3)
})

/**
 * `toBeVisible()` checks `display` and `visibility` — NOT opacity. A page whose
 * every section is `opacity: 0` passes every assertion above while rendering
 * blank, which is exactly the bug scroll-reveal animations introduce: they
 * serialise their hidden start state into the server HTML and then rely on an
 * IntersectionObserver that never runs without JavaScript.
 */
test('no content is left transparent without JavaScript', async ({ page }) => {
  await page.goto('/')

  const transparent = await page.evaluate(() => {
    const offenders: string[] = []
    document.querySelectorAll<HTMLElement>('main *').forEach((el) => {
      const style = getComputedStyle(el)
      if (parseFloat(style.opacity) < 0.15 && (el.textContent ?? '').trim().length > 12) {
        offenders.push(`${el.tagName.toLowerCase()}: ${(el.textContent ?? '').trim().slice(0, 60)}`)
      }
    })
    return offenders.slice(0, 10)
  })

  expect(transparent).toEqual([])
})
