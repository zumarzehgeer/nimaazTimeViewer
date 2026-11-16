import { execFileSync } from 'node:child_process'

// Test-only configuration: no real Firebase project or account is used.
const env = {
  ...process.env,
  VITE_FIREBASE_API_KEY: 'demo-browser-test-key',
  VITE_FIREBASE_AUTH_DOMAIN: 'demo-nimaaz.invalid',
  VITE_FIREBASE_PROJECT_ID: 'demo-nimaaz',
  VITE_FIREBASE_STORAGE_BUCKET: 'demo-nimaaz.invalid',
  VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890',
  VITE_FIREBASE_APP_ID: '1:1234567890:web:synthetic',
  VITE_USE_FIREBASE_EMULATORS: process.argv.includes('--emulators') ? 'true' : 'false',
}
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc'], { env, stdio: 'inherit' })
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build'], { env, stdio: 'inherit' })
