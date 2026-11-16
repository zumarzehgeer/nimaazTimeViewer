# Nimaaz Time Viewer

A React and TypeScript prayer-time display for a mosque screen, with configurable adhan/iqamah times, a next-prayer countdown, announcements and account-synced settings.

**[Try the synthetic guest demo](https://nimaaz-time-viewer.vercel.app/?demo=1)** · [Local guest setup](#try-the-guest-demo-locally) · [Account application](https://nimaaz-time-viewer.vercel.app) · [Code tour](#code-tour)

The guest demo uses synthetic prayer times and an example clock. It needs no account, Firebase configuration or prayer-provider connection. Switch between weekday, Friday and overnight scenarios; try the theme toggle or change the sample display name and iqamah offset. Changes remain in memory and reset on reload. The account application still requires sign-in.

Guest mode and the account application are available from the same Vercel deployment. The guest URL above opens synthetic data without an account; Account sign-in opens the separate authenticated flow. The implementation and its validation are merged into the default branch.

![Nimaaz guest demo on desktop](docs/nimaaz-guest-desktop.png)

## Try the guest demo locally

With Node 24, run `npm ci` and `npm run dev`, then open the URL printed by Vite with `?demo=1` appended. No `.env` file is needed for the demo. Account mode needs the Firebase setup below.

## Features in the implementation

- Location search and Aladhan prayer-time calculation methods.
- Configurable iqamah offsets, manual time overrides and a separate Friday Jumu'ah entry.
- Countdown to the next congregational prayer, including tomorrow's schedule.
- Mosque name, announcements, Hijri date/holiday information and optional rotating hadith content.
- Light/dark display themes and automatic switching around Fajr and Maghrib.
- Firebase email/password authentication and per-user Firestore settings.
- Browser-local settings, Firestore IndexedDB persistence and cached monthly prayer calendars.
- PWA manifest and service-worker caching of the application shell.

The display and demo share prayer-list, Friday-selection and countdown calculations. Account-backed features require a configured development project.

## Stack

| Layer | Technology |
|---|---|
| UI | React 18, TypeScript, Tailwind CSS, Tabler icons |
| Build | Vite, vite-plugin-pwa |
| Accounts and persistence | Firebase Authentication, Cloud Firestore |
| Dates and schedules | date-fns, Aladhan API |
| Location search | OpenStreetMap Nominatim |
| Optional hadith | hadithapi.com through a Vite/Vercel proxy |

## Run locally

The production build was verified with Node 24 on 14 November 2026. Use npm with the committed lockfile.

```bash
git clone https://github.com/zumarzehgeer/nimaazTimeViewer.git
cd nimaazTimeViewer
npm ci
```

Copy `.env.example` to `.env.local` and fill in the web-app configuration from a **separate development Firebase project**. In PowerShell:

```powershell
Copy-Item .env.example .env.local
```

In Bash, use `cp .env.example .env.local`. Then:

```bash
npm run dev
```

Open the URL printed by Vite. On Windows, use `npm.cmd` if PowerShell execution policy blocks npm's script.

### Firebase prerequisites

1. Register a web app in your development Firebase project and populate all six `VITE_FIREBASE_*` values from its configuration.
2. Enable email/password sign-in in Firebase Authentication and authorize the development hostname if required.
3. Create a Cloud Firestore database. Review the proposed owner-only `firestore.rules` against your requirements and the paths below. Those rules are tested locally; they have not been read from or deployed to the existing live project. No production rule deployment is performed by the commands in this README.
4. Start the app and use a disposable development account and synthetic mosque details. Choose a location and verify the display/settings in that isolated project.

Firebase web-app configuration is embedded in the browser bundle; it is not a service-account credential or a substitute for Firestore rules. Never put Firebase Admin credentials or private service-account keys in `VITE_*` variables.

### Configuration

| Variable | Firebase web-app field |
|---|---|
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Missing `VITE_FIREBASE_API_KEY` causes the application to stop at runtime with a configuration message. A successful build alone does not validate Firebase configuration, sign-in or database access.

Hadith content is optional and configured in application settings. Its current API key is supplied by the browser to `/api/hadith`; do not use a privileged credential. The Vite development proxy handles that endpoint locally. In production, `api/hadith.js` supplies the Vercel function; a static host must provide an equivalent endpoint for that feature.

### Cloudflare guest preview

`wrangler.jsonc` points Cloudflare Workers Builds at the generated `dist/` assets. The configured branch command, `npx wrangler versions upload`, uploads a preview version; it does not replace the existing Vercel account application. Open the preview with `?demo=1` to use the synthetic guest experience without Firebase configuration.

This Cloudflare target serves static assets only. It does not run the Vercel `api/hadith.js` function, and the current Cloudflare build has no Firebase variables. Account mode is therefore not an evaluation path on that preview. The existing Vercel URL remains the account application. Provisioning equivalent API routing and build configuration is separate work before using Cloudflare for account mode.

## Code tour

| Entry point | Responsibility |
|---|---|
| `src/App.tsx` | Auth/setup/display states, schedule composition and theme coordination |
| `src/demo/DemoApp.tsx` | Isolated synthetic demonstration and in-memory display controls |
| `src/lib/prayers.ts`, `src/lib/countdown.ts` | Shared schedule rules and next-adhan calculation |
| `src/components/MosqueDisplay.tsx` | Main display composition |
| `src/components/SettingsModal.tsx` | Display and schedule configuration |
| `src/components/AuthScreen.tsx` | Email/password account flows |
| `src/hooks/useCountdown.ts` | Next-prayer selection and countdown |
| `src/hooks/useSettings.ts` | Local settings and debounced cloud saves |
| `src/hooks/useFirestoreSettings.ts` | Firestore subscription and default merging |
| `src/hooks/usePrayerCache.ts` | Monthly calendar caching and refresh/fallback behavior |
| `src/services/aladhan.ts` | Prayer calendars, methods and Hijri-related requests |
| `src/services/geocoding.ts` | Nominatim search/reverse lookup |
| `src/services/hadith.ts` | Hadith selection and proxy requests |
| `src/firebase.ts` | Firebase initialization and persistent multi-tab cache |
| `vite.config.ts`, `api/hadith.js` | PWA caching and development/production proxy |

### Data flow and storage

After sign-in, the user's settings are read from Firestore and overlaid on defaults. Local changes update the screen/localStorage immediately, with Firestore writes debounced by 500 ms. The prayer cache reads stored monthly calendars and requests missing or stale calendar data; uncached daily values can fall back to the prayer-time API.

Firestore paths used by the source:

```text
users/{uid}/profile/info
users/{uid}/config/mosque
users/{uid}/prayerCache/{YYYY-MM}
```

The browser also stores settings, theme and failed-month bookkeeping. Offline operation depends on previously populated caches and an existing session; a first visit without connectivity cannot be assumed to work.

## Build and checks

```bash
npm run build
npm test
npx playwright install chromium
npm run test:e2e
npm run test:upgrade
npm run preview
```

The build performs TypeScript checking and creates `dist/`. Preview serves the static build; it does not run the Vercel API function. Node's test runner covers schedule boundaries and overrides. The browser-test command first creates a test-only build with synthetic Firebase configuration, then runs six desktop/mobile Chromium cases: isolated guest behavior, controls/focus, and configured sign-in-shell caching with offline navigation into guest mode. Firebase/provider requests are blocked in the account-shell test; no credentials are entered. CI separately builds without Firebase configuration before these browser checks. The separate [local account suite](docs/ACCOUNT-VALIDATION.md) uses official Auth/Firestore emulators for owner-only rules and account behavior, with synthetic/blocked providers. See the dated [validation and dependency record](docs/VALIDATION.md).

## Current limitations

- Guest mode uses synthetic data and omits cloud synchronization and live optional content; account mode remains gated by authentication.
- Proposed Firestore rules and local emulator tests are versioned. The [readiness record](docs/RELEASE-READINESS.md) compares their ownership boundary with observed deployed rules; the stricter candidate is not deployed by this work.
- Clock/countdown logic uses browser-local dates. Verify the display device's timezone matches the intended mosque schedule; selecting a remote location alone does not establish timezone correctness.
- Offline fallback can reuse stale calendar data, including previous-year data when available. Treat this as approximate fallback behavior and confirm schedules against local mosque guidance.
- Public APIs, fonts and optional content depend on network access and provider availability. Cached assets do not guarantee complete offline operation.
- Hosted Firebase operations and every historical worker remain unvalidated. A reconstructed prior-registration upgrade and signup rollback/retry are tested; emulator coverage is not full production parity.
- Dependency patches and scoped overrides reduce the audit from 24 affected-package entries to four low entries. None are currently moderate, high or critical. PWA build dependencies still have low findings; see the validation record. This is not a claim of zero known vulnerabilities.

## Attribution

Prayer times and calendar metadata come from Aladhan; location lookup uses OpenStreetMap Nominatim; optional hadith content comes from hadithapi.com. Third-party packages retain their respective licenses. This repository does not currently declare a project license.
