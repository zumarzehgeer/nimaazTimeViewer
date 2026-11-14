# Validation · 14 November 2026

Local verification used Windows, Node 24.18.0 and a production Vite build without Firebase environment variables.

| Check | Result |
|---|---|
| Schedule unit tests | 14 passed |
| Desktop/mobile Chromium demo regressions | 4 passed |
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
