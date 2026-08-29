import { test, expect } from '@playwright/test'

test.describe('homepage', () => {
  test('renders the owner identity and the visible sections', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Pranav Patil')

    for (const id of ['experience', 'projects', 'skills', 'education']) {
      await expect(page.locator(`#${id}`)).toBeVisible()
    }
  })

  test('renders real experience content, not placeholders', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Wio Bank PJSC').first()).toBeVisible()
    await expect(page.getByText(/WioGenie/).first()).toBeVisible()
  })

  test('resume PDF resolves', async ({ page, request }) => {
    await page.goto('/')
    const res = await request.get('/uploads/resume.pdf')
    expect(res.status()).toBe(200)
    expect(res.headers()['content-type']).toContain('pdf')
  })

  test('serves the admin panel', async ({ page }) => {
    const res = await page.goto('/admin/')
    expect(res?.status()).toBe(200)
  })

  test('exposes sitemap and robots', async ({ request }) => {
    expect((await request.get('/sitemap.xml')).status()).toBe(200)
    expect((await request.get('/robots.txt')).status()).toBe(200)
  })

  test('emits Person JSON-LD', async ({ page }) => {
    await page.goto('/')
    const raw = await page.locator('script[type="application/ld+json"]').first().textContent()
    expect(raw).toBeTruthy()
    const data = JSON.parse(raw!)
    expect(data['@type']).toBe('Person')
    expect(data.name).toBe('Pranav Patil')
  })
})

test.describe('articles', () => {
  test('list page renders', async ({ page }) => {
    await page.goto('/articles')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('unknown slug returns 404', async ({ page }) => {
    const res = await page.goto('/articles/definitely-not-a-real-article')
    expect(res?.status()).toBe(404)
  })
})
