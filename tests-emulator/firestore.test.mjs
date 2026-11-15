import { before, after, beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing'
import { doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, collection } from 'firebase/firestore'

let env
before(async () => {
  if (process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' || process.env.GCLOUD_PROJECT !== 'demo-nimaaz') {
    throw new Error('Rules tests require the local demo-nimaaz Firestore emulator.')
  }
  env = await initializeTestEnvironment({
    projectId: 'demo-nimaaz',
    firestore: { host: '127.0.0.1', port: 8080, rules: await readFile('firestore.rules', 'utf8') },
  })
})
beforeEach(async () => env.clearFirestore())
after(async () => env?.cleanup())

test('owners can create, read, update and delete each supported document', async () => {
  const db = env.authenticatedContext('owner').firestore()
  for (const [path, data] of [
    ['profile/info', { uid: 'owner', email: 'synthetic@example.invalid' }],
    ['config/mosque', { mosqueName: 'Synthetic mosque' }],
    ['prayerCache/2026-11', { days: [], fetchedAt: Date.now() }],
  ]) {
    const ref = doc(db, `users/owner/${path}`)
    await assertSucceeds(setDoc(ref, data))
    assert.equal((await assertSucceeds(getDoc(ref))).exists(), true)
    await assertSucceeds(updateDoc(ref, { testUpdate: true }))
    await assertSucceeds(deleteDoc(ref))
  }
})

test('unauthenticated callers cannot read or write account data', async () => {
  const db = env.unauthenticatedContext().firestore()
  for (const path of ['profile/info', 'config/mosque', 'prayerCache/2026-11']) {
    await assertFails(getDoc(doc(db, `users/owner/${path}`)))
    await assertFails(setDoc(doc(db, `users/owner/${path}`), { uid: 'owner' }))
  }
})

test('another account cannot read, overwrite, update or delete existing documents', async () => {
  const owner = env.authenticatedContext('owner').firestore()
  const other = env.authenticatedContext('other').firestore()
  for (const path of ['profile/info', 'config/mosque', 'prayerCache/2026-11']) {
    await setDoc(doc(owner, `users/owner/${path}`), { uid: 'owner' })
    const ref = doc(other, `users/owner/${path}`)
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, { uid: 'other' }))
    await assertFails(updateDoc(ref, { changed: true }))
    await assertFails(deleteDoc(ref))
  }
})

test('another account cannot create a missing document in an owner path', async () => {
  const db = env.authenticatedContext('other').firestore()
  await assertFails(setDoc(doc(db, 'users/owner/config/mosque'), { mosqueName: 'Other' }))
})

test('profile identity cannot be forged by its owner', async () => {
  const db = env.authenticatedContext('owner').firestore()
  const ref = doc(db, 'users/owner/profile/info')
  await assertFails(setDoc(ref, { uid: 'other' }))
  await setDoc(ref, { uid: 'owner' })
  await assertFails(updateDoc(ref, { uid: 'other' }))
})

test('unknown paths, invalid cache keys and user enumeration are denied', async () => {
  const db = env.authenticatedContext('owner').firestore()
  for (const path of ['users/owner/config/other', 'users/owner/prayerCache/2026-13', 'users/owner/private/info', 'public/settings']) {
    await assertFails(setDoc(doc(db, path), {}))
    await assertFails(getDoc(doc(db, path)))
  }
  await assertFails(getDocs(collection(db, 'users')))
})
