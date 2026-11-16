import { execFileSync } from 'node:child_process'
import { cpSync, copyFileSync, mkdirSync, existsSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'

// Reconstruct the old entry/registration from commit 0a40e198 using current
// dependencies and account code. This tests that registration/cache transition,
// not every historical deployment's exact bytes or IndexedDB schema.
const root = resolve('.test-builds')
const source = resolve(root, 'previous-source')
mkdirSync(source, { recursive: true })
if (existsSync(resolve(root, 'serve-current'))) unlinkSync(resolve(root, 'serve-current'))
execFileSync(process.execPath, ['scripts/build-browser-test.mjs'], { stdio: 'inherit' })
cpSync('dist', resolve(root, 'current'), { recursive: true })
cpSync('src', resolve(source, 'src'), { recursive: true })
cpSync('public', resolve(source, 'public'), { recursive: true })
for (const file of ['index.html', 'package.json', 'tsconfig.json', 'tsconfig.node.json', 'postcss.config.js', 'tailwind.config.js']) {
  if (existsSync(file)) copyFileSync(file, resolve(source, file))
}
copyFileSync('tests-upgrade/fixtures/previous-main.tsx', resolve(source, 'src/main.tsx'))
copyFileSync('tests-upgrade/fixtures/previous-vite.config.ts', resolve(source, 'vite.config.ts'))
execFileSync(process.execPath, ['node_modules/vite/bin/vite.js', 'build', source, '--config', resolve(source, 'vite.config.ts'), '--outDir', resolve(root, 'previous')], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_FIREBASE_API_KEY: 'demo-browser-test-key', VITE_FIREBASE_AUTH_DOMAIN: 'demo-nimaaz.invalid',
    VITE_FIREBASE_PROJECT_ID: 'demo-nimaaz', VITE_FIREBASE_STORAGE_BUCKET: 'demo-nimaaz.invalid',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '1234567890', VITE_FIREBASE_APP_ID: '1:1234567890:web:synthetic',
    VITE_USE_FIREBASE_EMULATORS: 'false',
  },
})
