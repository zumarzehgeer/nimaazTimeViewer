# Validation · 14 November 2026

Local verification used Windows, Node 24.18.0 and a production Vite build without Firebase environment variables.

| Check | Result |
|---|---|
| Schedule unit tests | 14 passed |
| Desktop/mobile Chromium guest and sign-in-shell regressions | 6 passed |
| TypeScript and production build | Passed |
| Manual desktop and 390×844 inspection | Passed; screenshots use synthetic data |

Unit cases cover adhan/iqamah overrides, Friday versus weekday selection, hour/midnight/month rollover, an exact adhan boundary, missing schedules, invalid times and chronological selection after manual reordering. Countdown selection now sorts future times rather than assuming array order, and can use tomorrow's schedule when today's is absent. It continues to count to adhan, using the device's local timezone.

Browser tests run the production bundle without Firebase configuration. They inspect requests to confirm the demo does not load the account chunk or call Firebase, Aladhan, Nominatim or the hadith proxy. A pre-existing account-settings localStorage value remains unchanged through demo interactions. Tests also cover Friday and overnight scenarios, in-memory name/offset editing, reset, light/dark switching, dialog Escape/focus restoration and page-level overflow on desktop and mobile. Google Fonts may still load as part of the existing page styling.

Demo mode is chosen before the account module is imported, so Firebase initialization is not required. It uses the shared display and schedule calculations. The demo does not install the account service worker; account mode retains service-worker registration. A previously installed account service worker may still control the origin. Real account authentication, Firestore authorization/synchronization, service-worker update behavior and live provider responses have not been revalidated in this phase.

## Dependency remediation

`npm audit fix` applied compatible lockfile updates; Vite moved from 5 to 7 with a compatible React plugin. Node 24 is recorded in package metadata and CI. The clean build and guest tests pass after the updates. No force downgrade or transitive override was used.

Audit counts at verification:

| Severity | Before | After |
|---|---:|---:|
| Critical | 2 | 0 |
| High | 10 | 4 |
| Moderate | 9 | 4 |
| Low | 3 | 2 |
| Total affected packages | 24 | 10 |

The critical protobufjs and websocket-driver findings are resolved in the lockfile. Remaining findings include Firebase/Firestore's pinned gRPC dependency (four high affected-package entries) and PWA build dependencies (glob/minimatch and deepmerge chains). Counts include parent packages affected by the same underlying advisory, not ten independent exploits. npm proposes older Firebase/PWA versions as force fixes; those were not applied because they need a separate compatibility assessment. This browser application uses Firebase's browser entry points, but that alone does not justify marking the whole dependency tree clean.

A follow-up should evaluate supported upstream releases or a narrowly scoped override with account/emulator coverage, then repeat `npm audit`, `npm ci`, build and both test suites. Firestore rules are still not versioned or emulator-tested here.

## Release review · 15 November 2026

Added desktop/mobile checks for the configured sign-in shell, first service-worker activation, offline reload and offline navigation into the guest demo. The test build uses a fixed synthetic Firebase configuration; Firebase and provider destinations are blocked, and no credentials are entered. Firebase authentication/backend calls are monitored and none occur. The existing account shell attempts the next-Hijri-holiday provider request, which the test blocks; this is not part of the isolated guest's provider behavior.

The new test exposed a registration regression: `injectRegister: false` prevents the PWA plugin from automatically selecting `skipWaiting`/`clientsClaim` from `registerType`. Explicit Workbox activation flags restore the intended account auto-update behavior. All 14 unit cases and six browser cases pass after the fix. This verifies installation and offline transitions, not an upgrade from every historical cached release, real sign-in, Firestore rules or synchronization.

Candidate Firebase 12.19/PWA 2 upstream updates still reported the same ten affected-package entries. They were not retained in that review. The subsequent Cloudflare fix configured static `dist/` assets, and the version upload passed. A public guest-only preview is linked in the README; it does not replace the Vercel account application.

## Dependency and local account follow-up · 15 November 2026

Added scoped overrides for Firestore's gRPC dependency (1.14.7) and Workbox's glob dependency (14.0.6), with decisions and reproduction steps in [ACCOUNT-VALIDATION.md](ACCOUNT-VALIDATION.md). Unlike the earlier upstream-only attempt, this reduces the audit to **four low affected-package entries, zero moderate/high/critical**. The remaining deepmerge/PWA build chain has no retained safe fix; no zero-finding claim is made. A clean `npm ci`, 14 unit tests, six existing browser checks, strict production compilation and precache generation pass. CI now fails the application audit at moderate severity or higher.

Added proposed owner-only Firestore rules and a demo-only emulator runner. Six rule cases pass against official local Firestore, exercising owner CRUD, unauthenticated/cross-account denial, exact supported paths, profile UID consistency and invalid cache keys. Three additional browser cases pass against real local Auth/Firestore emulators: sign-in/reload, two-browser subscription, offline write/reconnect synchronization, sign-out/account switching, legacy unowned local data, and signup profile/config persistence. Provider responses are synthetic or blocked.

The first account run reproduced two failures: B inherited A's in-memory settings after sign-out, and an unowned legacy browser setting could be copied into B's missing Firestore configuration. UID-scoped local storage, owner-tagged snapshots/state, cancellation of pending account writes and removal of automatic legacy imports fix both regressions. The final emulator run passes all nine cases. The signup test waits for asynchronous profile/config writes rather than assuming the authenticated display means those writes have completed.

No live project rules or data were read/changed. The proposed rules have not been deployed or compared with existing live rules. Hosted account behavior, partial signup failure recovery, historical service-worker upgrades and live providers still need separate validation. CLI/emulator tooling is installed separately from the application's audited lockfile.

## Readiness follow-up · 15 November 2026

Read the existing project's published owner-only Firestore rules through the signed-in console, without changing them or opening account documents. A dated fixture and three comparison cases verify the shared ownership boundary and the candidate's intentionally stricter paths/UID/month checks. This supersedes the prior "rules not compared" limitation; the candidate is still not deployed.

Added a signup rejection regression that failed before the fix and now verifies atomic profile/config writes, a retained form/error, rollback of the newly created Auth account after definitive rejection and same-email retry. The account suite has four browser cases. Added a separate reconstructed-baseline worker update test with two open tabs and offline guest navigation; it passes. The existing six guest/shell browser cases and 14 unit cases pass, as does production compilation. There are now nine rule/comparison cases and eleven browser cases in total.

The existing Vercel account URL loads its sign-in shell without entering credentials. This is a page-availability check. See [RELEASE-READINESS.md](RELEASE-READINESS.md) for signup/worker-test boundaries and the separate production-rollout decision. The audit remains four low affected-package entries, with no moderate/high/critical.
