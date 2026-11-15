import { execFileSync } from 'node:child_process'

// Refuse to run outside the explicitly selected local demo emulators.
if (process.env.GCLOUD_PROJECT !== 'demo-nimaaz' ||
    process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080' ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9099') {
  throw new Error('Account tests require the demo-nimaaz loopback emulators.')
}
function run(args) {
  execFileSync(process.execPath, args, { stdio: 'inherit', env: process.env })
}
run(['--test', 'tests-emulator/firestore.test.mjs'])
run(['--test', 'tests-emulator/deployed-rules.test.mjs'])
run(['scripts/build-browser-test.mjs', '--emulators'])
run(['node_modules/@playwright/test/cli.js', 'test', '--config', 'playwright.account.config.ts'])
