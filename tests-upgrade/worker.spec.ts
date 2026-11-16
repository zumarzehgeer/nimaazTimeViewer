import { test, expect } from '@playwright/test'
import { writeFile } from 'node:fs/promises'

test('previous registration upgrades two open tabs and serves the new guest shell offline', async ({ context, page }) => {
  await context.route(/identitytoolkit|securetoken|firestore\.googleapis|aladhan|nominatim|hadithapi|fonts\./, route => route.abort())
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  await page.evaluate(async () => { await navigator.serviceWorker.ready })
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await page.evaluate(() => localStorage.setItem('nimaaz-settings:synthetic-owner', 'preserve-on-upgrade'))
  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  // The old entry always loads account mode even with the guest query.
  await second.goto('/?demo=1')
  await expect(second.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
  const oldCaches = await page.evaluate(() => caches.keys())
  expect(oldCaches.length).toBeGreaterThan(0)
  await writeFile('.test-builds/serve-current', '1')
  await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready
    await new Promise<void>((resolve, reject) => {
      navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true })
      registration.update().catch(reject)
    })
  })
  await context.setOffline(true)
  try {
    for (const tab of [page, second]) {
      await tab.goto('/?demo=1')
      await expect(tab.getByRole('heading', { name: 'Guest demo', exact: true })).toBeVisible()
      await expect(tab.getByText('Demo Mosque', { exact: true })).toBeVisible()
      expect(await tab.evaluate(() => localStorage.getItem('nimaaz-settings:synthetic-owner'))).toBe('preserve-on-upgrade')
    }
  } finally {
    await context.setOffline(false)
  }
})
