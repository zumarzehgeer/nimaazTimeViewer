import { test, expect, type BrowserContext, type Page } from '@playwright/test'
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app'
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDocFromServer, terminate } from 'firebase/firestore'
import { DEFAULT_SETTINGS } from '../src/types/index'

const password = 'synthetic-test-only-123!'
const clients: { app: FirebaseApp; uid: string; email: string; db: ReturnType<typeof getFirestore> }[] = []
const initialSettings = { ...DEFAULT_SETTINGS, mosqueName: 'Account A', location: { label: 'Synthetic location', lat: 1, lng: 1 }, hadith: { ...DEFAULT_SETTINGS.hadith, enabled: false } }

test.beforeAll(async () => {
  if (process.env.GCLOUD_PROJECT !== 'demo-nimaaz' || process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Local demo emulators required')
  for (let i = 0; i < 2; i++) {
    const app = initializeApp({ projectId: 'demo-nimaaz', apiKey: 'demo-browser-test-key' }, `account-${i}-${Date.now()}`)
    const auth = getAuth(app)
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    const db = getFirestore(app)
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
    const email = `account-${i}-${Date.now()}@example.invalid`
    const { user } = await createUserWithEmailAndPassword(auth, email, password)
    clients.push({ app, db, email, uid: user.uid })
  }
  await setDoc(doc(clients[0].db, 'users', clients[0].uid, 'config', 'mosque'), initialSettings)
})
test.afterAll(async () => {
  for (const { app, db } of clients) { await terminate(db); await deleteApp(app) }
})

async function providers(context: BrowserContext) {
  // Provider data is synthetic; Auth and Firestore are real local emulator calls.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (['127.0.0.1', 'localhost'].includes(url.hostname)) return route.continue()
    if (url.hostname === 'api.aladhan.com' && url.pathname.includes('/timings/')) {
      return route.fulfill({ json: { code: 200, data: {
        timings: { Fajr: '05:30', Sunrise: '06:45', Dhuhr: '12:30', Asr: '15:30', Maghrib: '17:45', Isha: '19:15' },
        date: { hijri: { date: '01-01-1448', day: '1', weekday: { en: 'Synthetic', ar: '' }, month: { number: 1, en: 'Synthetic', ar: '' }, year: '1448' } },
        meta: { method: { name: 'Synthetic' } },
      } } })
    }
    if (url.hostname === 'api.aladhan.com' && url.pathname.includes('/methods')) return route.fulfill({ json: { data: {} } })
    if (url.hostname === 'nominatim.openstreetmap.org') return route.fulfill({ json: [{ place_id: 1, display_name: 'Synthetic City, Example', lat: '1', lon: '1' }] })
    return route.abort()
  })
}
async function signIn(page: Page, index: number) {
  await page.getByPlaceholder('admin@mosque.com').fill(clients[index].email)
  await page.getByPlaceholder('••••••••').fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
}

test('sign-in, live settings subscription, offline edits and account isolation', async ({ page, context, browser }) => {
  await providers(context)
  await page.goto('/')
  await signIn(page, 0)
  await expect(page.getByText('Account A', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Account A', { exact: true })).toBeVisible()

  // A second signed-in browser receives changes via the real Firestore listener.
  const secondContext = await browser.newContext()
  try {
    await providers(secondContext)
    const second = await secondContext.newPage()
    await second.goto('/')
    await signIn(second, 0)
    await expect(second.getByText('Account A', { exact: true })).toBeVisible()
    await context.setOffline(true)
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByPlaceholder('e.g. Masjid Al-Nur').fill('Offline edit from A')
    await page.getByRole('button', { name: 'Save Settings', exact: true }).click()
    await expect(page.getByText('Offline edit from A', { exact: true })).toBeVisible()
    await context.setOffline(false)
    await expect(second.getByText('Offline edit from A', { exact: true })).toBeVisible({ timeout: 15000 })
    await expect.poll(async () => (await getDocFromServer(doc(clients[0].db, 'users', clients[0].uid, 'config', 'mosque'))).data()?.mosqueName).toBe('Offline edit from A')

    // Sign out A, then sign in B with no config: neither UI nor Firestore may inherit A.
    await page.getByRole('button', { name: 'Settings', exact: true }).click()
    await page.getByRole('button', { name: 'Account', exact: true }).filter({ visible: true }).click()
    await page.getByRole('button', { name: 'Sign Out', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeVisible()
    await signIn(page, 1)
    await expect(page.getByText('Set your mosque location to get started', { exact: true })).toBeVisible()
    await expect(page.getByText('Offline edit from A', { exact: true })).toHaveCount(0)
    expect((await getDocFromServer(doc(clients[1].db, 'users', clients[1].uid, 'config', 'mosque'))).exists()).toBe(false)
  } finally {
    await context.setOffline(false)
    await secondContext.close()
  }
})

test('a missing account config never imports an unowned legacy browser setting', async ({ page, context }) => {
  await providers(context)
  await page.addInitScript(settings => localStorage.setItem('nimaaz-settings', JSON.stringify(settings)), initialSettings)
  await page.goto('/')
  await signIn(page, 1)
  await expect(page.getByText('Set your mosque location to get started', { exact: true })).toBeVisible()
  expect((await getDocFromServer(doc(clients[1].db, 'users', clients[1].uid, 'config', 'mosque'))).exists()).toBe(false)
})

test('sign-up persists a profile and settings under the new authenticated UID', async ({ page, context }) => {
  await providers(context)
  await page.goto('/')
  await page.getByRole('button', { name: 'Create account', exact: true }).click()
  await page.getByPlaceholder('e.g. Masjid Al-Nur').fill('Synthetic signup mosque')
  await page.getByPlaceholder('Search city...').fill('Synthetic')
  await page.getByText('Synthetic City, Example', { exact: true }).click()
  const email = `signup-${Date.now()}@example.invalid`
  await page.getByPlaceholder('admin@mosque.com').fill(email)
  await page.getByPlaceholder('At least 6 characters').fill(password)
  await page.getByRole('button', { name: 'Create Account', exact: true }).click()
  await expect(page.getByText('Synthetic signup mosque', { exact: true })).toBeVisible()
  const { user } = await signInWithEmailAndPassword(getAuth(clients[1].app), email, password)
  // Auth resolves before the asynchronous profile/config writes finish.
  await expect.poll(async () => (await getDocFromServer(doc(clients[1].db, 'users', user.uid, 'profile', 'info'))).data()).toMatchObject({ uid: user.uid, email, mosqueName: 'Synthetic signup mosque' })
  await expect.poll(async () => (await getDocFromServer(doc(clients[1].db, 'users', user.uid, 'config', 'mosque'))).data()).toMatchObject({ mosqueName: 'Synthetic signup mosque', location: { lat: 1, lng: 1 } })
})
