import { test, expect } from '@playwright/test'

test('configured sign-in shell caches and opens the guest demo offline', async ({ page, context }) => {
  const backendRequests: string[] = []
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => {
    if (/identitytoolkit|securetoken|firestore\.googleapis/.test(request.url())) backendRequests.push(request.url())
  })
  await context.route(/identitytoolkit|securetoken|firestore\.googleapis|aladhan|nominatim|hadithapi/, route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    if (!registration.active) throw new Error('Account service worker did not activate')
  })
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await context.setOffline(true)
  try {
    await page.reload()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Explore the guest demo', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Guest demo', exact: true })).toBeVisible()
    await expect(page.getByText('Demo Mosque', { exact: true })).toBeVisible()
    expect(backendRequests).toEqual([])
    expect(errors).toEqual([])
  } finally {
    await context.setOffline(false)
  }
})
