import { test, expect } from '@playwright/test'

/**
 * The spec requires that nothing readable exists only inside a <canvas> or a
 * client-side fetch. With JavaScript disabled the 3D hero cannot run at all, so
 * this is the sharpest available test of that rule.
 */
test('site is fully readable without JavaScript', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pranav Patil')
  await expect(page.getByText('Wio Bank PJSC').first()).toBeVisible()
  await expect(page.getByText(/Splitwise Backend Clone/).first()).toBeVisible()
  await expect(page.getByText(/Dhirubhai Ambani University/).first()).toBeVisible()

  const links = await page.getByRole('link').count()
  expect(links).toBeGreaterThan(3)
})
