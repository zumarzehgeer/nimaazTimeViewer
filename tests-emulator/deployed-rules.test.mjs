import { before, after, test } from 'node:test'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'

let env
before(async () => {
  if (process.env.GCLOUD_PROJECT !== 'demo-nimaaz' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Local demo emulator required')
  env = await initializeTestEnvironment({ projectId: 'demo-nimaaz', firestore: {
    host: '127.0.0.1', port: 8080,
    rules: await readFile('tests-emulator/fixtures/deployed-2026-11-15.rules', 'utf8'),
  } })
  await env.clearFirestore()
})
after(async () => {
  await env?.cleanup()
  const restored = await initializeTestEnvironment({ projectId: 'demo-nimaaz', firestore: {
    host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8'),
  } })
  await restored.cleanup()
})

test('observed deployed rules support owner CRUD on all existing application paths', async () => {
  const db = env.authenticatedContext('owner').firestore()
  for (const path of ['profile/info', 'config/mosque', 'prayerCache/2026-11']) {
    const ref = doc(db, `users/owner/${path}`)
    await assertSucceeds(setDoc(ref, { uid: 'owner' }))
    await assertSucceeds(getDoc(ref))
    await assertSucceeds(updateDoc(ref, { updated: true }))
    await assertSucceeds(deleteDoc(ref))
  }
})

test('observed deployed rules deny anonymous and cross-account operations', async () => {
  for (const ctx of [env.unauthenticatedContext(), env.authenticatedContext('other')]) {
    for (const path of ['profile/info', 'config/mosque', 'prayerCache/2026-11']) {
      const ref = doc(ctx.firestore(), `users/owner/${path}`)
      await assertFails(getDoc(ref))
      await assertFails(setDoc(ref, { uid: 'owner' }))
      await assertFails(updateDoc(ref, { changed: true }))
      await assertFails(deleteDoc(ref))
    }
  }
})

test('observed deployed rules are broader than the proposed exact-path rules', async () => {
  const db = env.authenticatedContext('owner').firestore()
  // Expected differences, not assertions that these writes should be deployed.
  await assertSucceeds(setDoc(doc(db, 'users/owner/profile/info'), { uid: 'different' }))
  await assertSucceeds(setDoc(doc(db, 'users/owner/config/other'), {}))
  await assertSucceeds(setDoc(doc(db, 'users/owner/prayerCache/2026-13'), {}))
})
