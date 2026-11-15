# Local account and authorization validation

Use Node 24 and Java 21, then run:

```bash
npm ci
npx playwright install chromium
npm run test:emulators
```

The command starts Firebase CLI 15.36.0's official Authentication and Firestore emulators on `127.0.0.1:9099` and `127.0.0.1:8080`, selecting only the non-live `demo-nimaaz` project. The CLI's own tooling dependencies are separate from the application lockfile/audit. Initial use downloads that CLI and emulator binaries. Ports must be available. No Firebase login or real credentials are needed. The runner rejects missing or unexpected project/host settings, builds with synthetic web configuration and shuts down its emulators after success or failure. Do not use real account details; emulator accounts and data are disposable.

`firebase.emulators.json` loads the proposed `firestore.rules`. No command deploys rules, imports production data or changes the existing Vercel/Cloudflare production application.

The rule suite covers owner CRUD for profile/config/monthly-cache documents, unauthenticated denial, cross-account reads/creates/updates/deletes, immutable profile UID, unknown paths, invalid month keys and denied user enumeration. The rules deliberately restrict access to the application's documented paths. They are an account ownership boundary, not a complete settings/cache schema or a rate/size policy.

Browser regressions use actual local Firebase Auth/Firestore calls. Provider responses are synthetic or blocked. They cover sign-in persistence across reloads, the Firestore subscription in a second browser, offline local edits and synchronization after reconnect, sign-out followed by an account with no settings, unowned legacy browser data and signup profile/settings persistence. This exercises the Node Firestore/gRPC path for rule tests and browser WebChannel path for account behavior. It does not validate Google's hosted services or live providers.

## Reproduced settings ownership bug

Before the fix, both browsers authenticated successfully and the offline write synchronized, but two account-isolation checks failed. Signing out account A left its settings in React state, which a missing account B configuration could inherit. The legacy `nimaaz-settings` key had no owner and could also be automatically copied into B's Firestore path.

Account settings now use `nimaaz-settings:<uid>`, snapshot results are tagged with their owner, and state is switched when the UID changes. Pending debounced writes are cancelled when the account changes. Signup writes only the new UID's local key; sign-out clears that account's key. The legacy shared key is not automatically imported into an account. Existing settings already stored in that account's Firestore document continue to load normally. A user with only unsynced legacy local settings must deliberately re-enter them after confirming the intended account; automatic ownership guessing is unsafe.

## Dependency override decisions

The application retains Firebase 12.12 rather than forcing npm's suggested downgrade. Firebase still pins gRPC to `~1.9.0`; the scoped `@firebase/firestore` override selects `@grpc/grpc-js` 1.14.7, a patched same-major release. Official advisory: https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j

The `workbox-build` override selects glob 14.0.6. This crosses glob's major range, so it is supported by the production build, precache generation and first-install/offline browser regressions rather than assumed compatible from the version number. Workbox uses `globSync(pattern, {cwd, follow, ignore})`, which the tested release supports. Remove/reassess both overrides when the parent packages ship compatible dependency ranges.

The resulting audit reports four **low** affected-package entries (deepmerge and the PWA build dependency chain), with no moderate/high/critical entries. The latest deepmerge is still affected; no downgrade or unmaintained replacement is introduced. CI fails on moderate-or-higher application dependency findings. This is not a zero-finding audit or a general security guarantee.

Still outstanding: comparison with deployed Firebase rules, live-project sign-in and Firestore behavior, recovery from partial signup failure, upgrades from historical service-worker versions, broad data-schema validation and production deployment review. Local account coverage supports review of the draft; it does not establish production parity.

Sources: [Firebase rules testing](https://firebase.google.com/docs/firestore/security/test-rules-emulator), [Local Emulator Suite setup](https://firebase.google.com/docs/emulator-suite/install_and_configure).
