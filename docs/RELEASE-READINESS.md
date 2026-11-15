# Release readiness · 15 November 2026

## Existing project comparison

Read the published rules for the `nimaaztimeviewer` project's default Firestore database through the signed-in Firebase Console. The selected published revision is dated 12 April 2026, 8:34 PM in the console. A transcription is versioned at `tests-emulator/fixtures/deployed-2026-11-15.rules`. No live rules or account documents were changed.

The deployed rule allows authenticated users to read/write any document beneath their own `/users/{uid}` path. The proposed rule retains that ownership check, restricts writes to the application's exact profile/config/month-cache paths, checks profile UID and validates month keys. It is intentionally stricter, not byte-for-byte parity. Three local emulator comparison cases verify supported owner operations, anonymous/cross-account denial, and those known differences. Six further cases verify the proposed rules. The test runner restores the proposed rules in the local emulator before browser tests.

The console shows the Email/Password provider enabled, and the existing public Vercel URL loads its sign-in shell. No credentials were entered and no live account was created for this review. This confirms configuration and page availability, not hosted sign-in or data synchronization.

## Signup failure recovery

The earlier signup wrote profile/config separately and allowed `onAuthStateChanged` to unmount its form before setup finished. A denied-profile emulator regression failed before the fix because the signup error/form was lost.

Signup now keeps its form mounted, gates account settings/cache hooks and commits the two Firestore documents in one batch. A definitive permission/validation rejection attempts to delete only the user created by that signup. A successful rollback leaves no account or partial documents and allows retrying the same email. Ambiguous errors or a failed deletion retain the possible account, sign out and tell the user to sign in instead of creating it again. A lost acknowledgment is not grounds to delete a possibly completed account. A successful batch is not rolled back for optional local-cache failure.

Authentication and Firestore are separate services: this is not a distributed transaction. Closing/reloading the page mid-signup or never reconnecting during a pending offline write still needs operational recovery. A retained account can sign in and complete the existing location/settings setup; the app does not automatically overwrite an existing profile or guess whether an unrelated account was created by a prior attempt.

## Service-worker transition

`npm run test:upgrade` reconstructs the entry point and PWA registration configuration from baseline commit `0a40e198a910b64c88a8b98b3d45af36f87ecb45`, using current dependencies and current account code. The fixtures preserve the prior eager entry and plugin-injected registration. This is a controlled registration/cache regression, not an archived production bundle.

The browser test installs that previous worker, opens a second controlled tab, switches its local server to the current build, invokes a real worker update, then loads the new guest page offline in both tabs. It checks the guest display and preservation of an account-scoped browser setting. Both built bundles use synthetic Firebase configuration; provider/backend traffic is blocked. Old hashed assets remain available on the test server while tabs transition. CI runs this separately from first-install/offline checks and account emulators.

## Review boundary

The repository changes are suitable for review with emulator evidence, an observed deployed-rule comparison and a representative worker transition. The existing application can continue using its owner-only deployed rule; merging source does not require publishing the stricter candidate rule. A production rule rollout needs a separate compatibility decision for any historical documents outside those exact paths. No such rollout is included here.

Four low PWA build-chain audit entries remain; there are no moderate/high/critical entries in the last verified application audit. Live provider reliability, hosted Firebase operations, every historical browser cache and interrupted signup recovery are not established by local tests. Merging this branch can trigger the repository's Vercel/Cloudflare production integrations, so source review and production rollout are separate decisions.
