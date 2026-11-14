import { test, expect } from '@playwright/test'

test('guest demo stays independent of Firebase, providers and existing browser data', async ({ page }) => {
  const unexpectedRequests: string[] = []
  const errors: string[] = []
  page.on('request', (request) => {
    if (/firebase|googleapis\.com\/(?!css)|aladhan|nominatim|hadithapi|\/api\/hadith|\/assets\/App-/.test(request.url())) unexpectedRequests.push(request.url())
  })
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => localStorage.setItem('nimaaz-settings', 'existing-account-settings'))
  await page.goto('/?demo=1')
  await expect(page.getByRole('heading', { name: 'Guest demo', exact: true })).toBeVisible()
  await expect(page.getByText('Demo Mosque', { exact: true })).toBeVisible()
  await page.getByLabel('Sample day').selectOption('friday')
  await expect(page.getByText("Jumu'ah", { exact: true }).filter({ visible: true })).toHaveCount(2)
  await expect(page.getByText('Dhuhr', { exact: true }).filter({ visible: true })).toHaveCount(0)
  await page.getByLabel('Sample day').selectOption('overnight')
  await expect(page.getByText('Next Prayer · Tomorrow', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Display name').fill('Example Community')
  await dialog.getByLabel('Dhuhr iqamah offset (minutes)').fill('25')
  await dialog.getByRole('button', { name: 'Apply to demo' }).click()
  await expect(page.getByText('Example Community', { exact: true })).toBeVisible()
  await expect(page.getByText('12:55 PM', { exact: true }).filter({ visible: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click()
  await expect(page.getByText('Demo Mosque', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('nimaaz-settings'))).toBe('existing-account-settings')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(unexpectedRequests).toEqual([])
  expect(errors).toEqual([])
})

test('theme toggle and settings Escape work with keyboard access', async ({ page }) => {
  await page.goto('/?demo=1')
  await page.getByRole('button', { name: 'Switch to light theme', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Switch to dark theme', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Settings', exact: true })).toBeFocused()
})
