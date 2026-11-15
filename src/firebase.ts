import { initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator,
} from 'firebase/firestore'

if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  throw new Error('Firebase config is missing. Please fill in your VITE_FIREBASE_* values in the .env file.')
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

// persistentLocalCache enables IndexedDB-backed offline persistence.
// The app will read/write from IndexedDB when offline and sync when back online.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// Explicit test-only opt-in. Never connect a real project or remote page to emulators.
if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  if (!firebaseConfig.projectId?.startsWith('demo-') || !['localhost', '127.0.0.1'].includes(location.hostname)) {
    throw new Error('Firebase emulators require a demo project on loopback.')
  }
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
}
