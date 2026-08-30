# Goal

Build the mobile-first period calendar on GitHub Pages against the existing Firebase project and its live `periods` collection, preserving all 383 legacy documents while adding authenticated editing, optional comments, range merging, deletion, and two next-start predictions.

# Approach

Reuse the existing document-per-period model and its exact field types: Firestore Timestamp `startedAt`, Firestore Timestamp `endedAt`, and boolean `isEnded`. Add only an optional `comment` string so every existing document remains readable without migration; normalize legacy timestamps to date-only values by rounding to the nearest UTC midnight, then write all new/edited dates at canonical UTC midnight.

Host the React/Vite application on GitHub Pages while Firebase continues to provide Google Authentication and Firestore. Register a Firebase Web App in the existing Firebase project to obtain public browser configuration; never copy, bundle, upload, or expose the Admin service-account JSON from the utility repository.

# Existing System Findings

- `<utility-repository>/firestore/config.yml` points to Firebase project `projectx-d645c`, collection `periods`, and an Admin service-account JSON.
- `<utility-repository>/firestore/operate.py` backs up and restores `startedAt`, `endedAt`, and `isEnded`, with document IDs used only in backups.
- `<utility-repository>/firestore/prepare_raw_periods.py` confirms that all legacy periods are treated as ended date ranges.
- A read-only live query confirmed 383 documents, all containing exactly `startedAt: Timestamp`, `endedAt: Timestamp`, and `isEnded: true`, with every start at or before its end.
- Legacy timestamp times are 00:00, 21:00, 22:00, or 23:00 UTC. The selected nearest-midnight rule maps late-evening instants to the following calendar day and UTC-midnight instants to the same day.
- The Firebase project currently has no registered Web App. The existing service account is an Admin credential with a private key and is unsuitable for browser use.
- Deployed Firestore rules currently allow any authenticated user to read/write every document path. Only the `periods` root collection exists, so the new version-controlled rules can safely narrow access to that collection and validate its schema.
- Google provider client credentials already exist in Firebase Authentication; the GitHub Pages hostname still needs to be added to Authorized domains.

# File Changes

All files are **Create** because the target repository still contains no application implementation.

## Project and quality tooling

- **Create** `package.json` — React, Vite, TypeScript, modular Firebase SDK, date-fns, Testing Library, Vitest, ESLint, Firebase Rules testing, and scripts for development/build/lint/unit/rules tests.
- **Create** `package-lock.json` — reproducible npm dependency graph.
- **Create** `index.html` — Vite entry point with mobile viewport/theme metadata.
- **Create** `vite.config.ts` — React/Vitest configuration and validated GitHub Pages `VITE_BASE_PATH`.
- **Create** `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` — strict browser/tooling TypeScript settings.
- **Create** `eslint.config.js` — TypeScript and React Hooks linting.
- **Create** `vitest.setup.ts` — DOM matchers, cleanup, and deterministic test setup.
- **Create** `.gitignore` — exclude dependencies, builds, coverage, local emulator state, and real environment files.
- **Create** `.env.example` — placeholders for the registered Firebase Web App's public config, emulator flag, and Pages base path; explicitly exclude Admin credential fields.

## Firebase and GitHub deployment

- **Create** `firebase.json` — Firestore rules/indexes and local Auth/Firestore emulator configuration; no Firebase Hosting dependency.
- **Create** `firestore.rules` — authenticated shared access restricted to `periods/{periodId}`, exact backward-compatible schema validation, comment length limit, and deny-all for every other path.
- **Create** `firestore.indexes.json` — empty composite index definition because `orderBy("startedAt")` uses a built-in single-field index.
- **Create** `.github/workflows/deploy-pages.yml` — locked install, lint/tests/build, Pages artifact upload, and deployment with minimum permissions and deployment concurrency.
- **Create** `tests/firestore.rules.test.ts` — signed-out denial, signed-in shared access, legacy document compatibility, optional-comment writes, type/schema/date rejection, and deny-other-collections coverage.
- **Create** `README.md` — existing-project setup, Firebase Web App registration, Google/Auth domain configuration, safe credential handling, emulator commands, GitHub variables, Pages setup, rules deployment, and rollback notes.

## Application foundation and authentication

- **Create** `src/vite-env.d.ts` — typed `VITE_FIREBASE_*`, `VITE_USE_EMULATORS`, and `VITE_BASE_PATH` variables.
- **Create** `src/main.tsx` — render React with the Auth provider and global styles.
- **Create** `src/App.tsx` — display configuration/loading/sign-in/calendar states without a routing dependency.
- **Create** `src/styles.css` — neutral “Periods” styling, mobile-safe layout, 44×44 px controls, bottom sheet/dialog breakpoints, accessible focus/contrast, and reduced motion.
- **Create** `src/lib/firebase.ts` — initialize the registered Web App from public environment values, connect emulators when requested, and export Auth/Firestore singletons.
- **Create** `src/auth/AuthProvider.tsx` — observe Auth state and implement Google popup sign-in/sign-out; map popup blocked/closed, unauthorized-domain, and network errors to retryable messages.
- **Create** `src/auth/useAuth.ts` — typed Auth context hook.
- **Create** `src/auth/AuthProvider.test.tsx` — popup success/error/retry/sign-out behavior and proof that redirect auth is not used on GitHub Pages.
- **Create** `src/components/SignInScreen.tsx` — neutral Google sign-in UI and configuration/error feedback.

## Existing-schema adapter and domain rules

- **Create** `src/types/period.ts` — raw Firestore record, normalized date-only period, editor draft, and prediction types.
- **Create** `src/domain/dateUtils.ts` — ISO date parsing/formatting, nearest-midnight legacy Timestamp conversion, canonical UTC-midnight writes, calendar arithmetic, month matrices, and today/future checks.
- **Create** `src/domain/periodRules.ts` — record normalization, chronological sorting, overlap/adjacency detection, merge bounds, comment combination, and range validation.
- **Create** `src/domain/predictions.ts` — exact-latest-gap and trailing-12-month-average prediction calculations.
- **Create** `src/domain/dateUtils.test.ts` — legacy 21:00/22:00/23:00/00:00 mappings, canonical writes, DST independence, leap days, and month/year boundaries.
- **Create** `src/domain/periodRules.test.ts` — commentless legacy records, overlap/adjacency/multi-merge/edit semantics, reversed taps, future rejection, and comment ordering.
- **Create** `src/domain/predictions.test.ts` — 14/15-day threshold, exact formula, 12-month sample filtering/rounding, unavailable history, and boundary cases.

## Existing Firestore data access

- **Create** `src/data/periodConverter.ts` — Firestore converter between legacy/new Timestamp documents and normalized ISO-date UI records; treat absent `comment` as an empty string and require `isEnded === true`.
- **Create** `src/data/periodRepository.ts` — realtime `periods` query ordered by `startedAt`, create/edit/merge batched writes using canonical Timestamps, optional comments, and deletion.
- **Create** `src/data/usePeriods.ts` — subscription lifecycle, loading/error state, and duplicate-write prevention.
- **Create** `src/data/periodConverter.test.ts` — exact compatibility fixtures for legacy documents and new commented documents.
- **Create** `src/data/periodRepository.test.ts` — emulator-backed legacy reads, ordered snapshots, create/edit/merge/delete, missing-comment handling, and two-user shared visibility.

## Calendar UI

- **Create** `src/components/CalendarPage.tsx` — coordinate authenticated data, visible months, selections, editor, predictions, mutation feedback, and sign-out.
- **Create** `src/components/TwoMonthCalendar.tsx` — initial previous/current pair and past-only navigation, with forward navigation capped at current month.
- **Create** `src/components/MonthGrid.tsx` — accessible date buttons and marked/selected/predicted/today/future states.
- **Create** `src/components/PeriodEditor.tsx` — bottom sheet/dialog for comments, save/cancel, change dates, merged-note review, and confirmed deletion.
- **Create** `src/components/PredictionSummary.tsx` — simultaneous latest-gap and 12-month-average predicted dates below the calendar.
- **Create** `src/components/CalendarPage.test.tsx` — complete mobile/keyboard workflows over legacy and commented records.

# Implementation Steps

## Task 1: Register safe browser access to the existing project

1. Use the Firebase console or Management API, with explicit approval before changing external state, to register one Web App in existing project `projectx-d645c`.
2. Capture only the generated public Firebase Web config in local environment variables and GitHub repository variables.
3. Do not copy `<utility-repository>/firestore/service_account.json` into the frontend repository, GitHub, Actions secrets, Vite environment, build artifact, or browser bundle.
4. Verify the Google provider is enabled and add the final `<username>.github.io` hostname (without repository path) to Firebase Auth Authorized domains.
5. Document the distinction between public Web config and privileged Admin credentials in `.env.example` and `README.md`.

## Task 2: Bootstrap the React/Vite project and Pages deployment

1. Create the package, TypeScript, Vite, lint, test, HTML, and global CSS foundation in `package.json`, `tsconfig*.json`, `vite.config.ts`, `eslint.config.js`, `vitest.setup.ts`, `index.html`, `src/main.tsx`, and `src/styles.css`.
2. In `vite.config.ts`, validate `VITE_BASE_PATH`; use `/<repository>/` for project Pages and `/` for a custom/user domain.
3. Add `.github/workflows/deploy-pages.yml` using official Pages actions, `npm ci`, all checks before deployment, minimum permissions, and a concurrency group.
4. Keep the application router-free so refreshing the single calendar URL requires no rewrite support from GitHub Pages.

## Task 3: Lock down the existing Firestore schema safely

1. Add `firestore.rules` that permits authenticated reads/deletes only at `periods/{periodId}`.
2. For create/update, require `startedAt` and `endedAt` to be timestamps, require `startedAt <= endedAt`, require `isEnded == true`, allow only those three fields plus optional `comment`, and limit comments to 2,000 characters.
3. Deny every other Firestore path, replacing the currently broad authenticated wildcard.
4. Prove in `tests/firestore.rules.test.ts` that unmodified legacy documents and new commented documents are valid, signed-out access fails, malformed writes fail, and other collections are inaccessible.
5. Deploy rules independently from frontend hosting and document how to restore the prior ruleset if verification exposes an unknown client dependency.

## Task 4: Implement lossless legacy date conversion

1. In `src/domain/dateUtils.ts`, convert a Firestore Timestamp to a date-only ISO value by adding 12 hours to its UTC instant and reading the resulting UTC year/month/day (“nearest midnight”).
2. Convert every saved ISO day to `Timestamp.fromDate(new Date(Date.UTC(year, month - 1, day)))`, so new records are canonical UTC midnight regardless of browser time zone.
3. Keep all calendar and prediction arithmetic on normalized ISO days, never on browser-local `Date` interpretations of Firestore instants.
4. Cover 21:00, 22:00, 23:00, and 00:00 UTC inputs, DST transitions, leap days, and December/January in `src/domain/dateUtils.test.ts`.
5. In `src/data/periodConverter.ts`, accept exactly the live required fields, interpret missing `comment` as `""`, and surface malformed documents without silently rewriting them.

## Task 5: Implement domain rules and existing collection access

1. In `src/domain/periodRules.ts`, normalize tap order and detect every record that overlaps or directly touches the selected inclusive range.
2. For a single-record edit, retain that document ID. For a multi-record merge, retain the earliest touched document ID, delete the remaining touched IDs, and union the minimum start/maximum end.
3. Combine non-empty comments in chronological order separated by blank lines; show the combined text in the editor before any write.
4. In `src/domain/predictions.ts`, show predictions only when the latest start is more than 14 calendar days before today:
   - Latest-gap prediction: `latest.end + (latest.start - previous.end)`.
   - Average prediction: mean of adjacent end-to-next-start gaps whose later start is within the inclusive trailing 12 calendar months, rounded to the nearest whole day, added to `latest.end`.
5. In `src/data/periodRepository.ts`, subscribe to the existing `periods` collection with `orderBy("startedAt")`; use one Firestore batch to set the retained/new record and delete superseded records.
6. New and updated records write only `startedAt`, `endedAt`, `isEnded: true`, and optional `comment`; do not introduce migration-only audit fields absent from the established schema.
7. Use `src/data/usePeriods.ts` to manage realtime lifecycle and pending/error state; disable duplicate saves/deletes while a batch is pending.
8. Validate legacy, CRUD, merge, ordering, and shared two-user behavior with `src/data/periodConverter.test.ts` and `src/data/periodRepository.test.ts` against emulators seeded in the live schema shape.

## Task 6: Build the mobile calendar experience

1. Implement `src/auth/AuthProvider.tsx`, `src/auth/useAuth.ts`, `src/components/SignInScreen.tsx`, and `src/App.tsx`; use popup-only Google authentication initiated synchronously by the user's button click.
2. Render two consecutive months with `src/components/TwoMonthCalendar.tsx` and `src/components/MonthGrid.tsx`: previous/current initially, stacked under 768 px, side-by-side at/above 768 px, browse older pairs one month at a time, and never browse past the current month.
3. Let the first unmarked date tap set a range start and the second open a normalized editor draft. A marked-date tap opens its record; “Change dates” seeds range selection from that period.
4. Disable dates after local today. Before opening `src/components/PeriodEditor.tsx`, compute all touched records, merged bounds, and combined comment; require explicit Save.
5. Provide inline validation, save/write errors, cancel, change-dates, and confirmed deletion in `src/components/PeriodEditor.tsx`.
6. Render both predictions through `src/components/PredictionSummary.tsx`, including their gap/sample counts and explicit unavailable-history states.
7. Test complete authenticated, mobile, keyboard, merge/comment, delete, navigation, and prediction paths in `src/components/CalendarPage.test.tsx`.

## Task 7: Verify against the existing project and deploy

1. Run lint, unit/component tests, emulator rules/repository tests, TypeScript, and production build.
2. Before production writes, run a read-only smoke test against the existing collection: confirm 383 records load, normalized periods remain ordered/non-overlapping, and no document content is modified.
3. Deploy the narrowed Firestore rules, sign in through the new Firebase Web App, and verify legacy reads before enabling edit controls.
4. Exercise create/comment/edit/merge/delete on a deliberate temporary test record, then remove that record through the UI and confirm existing records are unchanged.
5. Deploy the successful build through GitHub Actions and validate popup sign-in, Pages subpath assets, realtime updates in two sessions, and mobile browsers.

# Acceptance Criteria

1. The browser bundle and Pages artifact contain no service-account JSON, private key, Admin SDK, or privileged credential.
2. The frontend initializes against existing Firebase project `projectx-d645c` using a newly registered Web App's public config.
3. Google popup sign-in succeeds from the Pages hostname after domain authorization; signed-out users cannot read Firestore.
4. The initial production read returns all 383 existing `periods` documents without migration or write-back.
5. Every existing document maps from Timestamp fields to an inclusive normalized period; missing `comment` renders as an empty editable comment.
6. A 21:00, 22:00, or 23:00 UTC legacy timestamp maps to the following ISO calendar day; 00:00 UTC maps to the same day.
7. Every new/edited date is written as a Firestore Timestamp at 00:00:00 UTC with `isEnded: true`.
8. Rules allow authenticated reads and schema-valid create/update/delete only under `periods/{periodId}`; signed-out access, unknown fields, wrong types, reversed dates, comments over 2,000 characters, and every other path are denied.
9. Any authenticated Google account sees and edits the same shared dataset, as selected.
10. The previous and current months display initially; narrow screens stack them, wider screens place them side-by-side, older months are reachable, and future month pairs are not.
11. Future dates are disabled and cannot be included in a saved period.
12. Two unmarked taps open an inclusive range draft; tap order is normalized and Cancel makes no write.
13. A marked date opens exactly its existing period and comment.
14. Saving an isolated range creates one document in the established schema with optional `comment`.
15. Saving a touching/overlapping range atomically leaves one unioned record, retains the earliest touched ID, deletes other touched records, and never leaves a normal-UI overlap.
16. A merge draft combines non-empty comments chronologically with blank-line separators and requires explicit review/save.
17. Delete requires confirmation; cancelling changes nothing and confirming removes only the selected document.
18. Predictions are absent until the latest start is more than 14 days old.
19. When eligible, the latest-gap prediction exactly equals `latest.end + (latest.start - previous.end)`.
20. The average prediction uses only qualifying adjacent pairs from the trailing 12 calendar months, rounds the mean gap to the nearest whole day, and adds it to the latest end.
21. Both calculated prediction dates display together when samples exist; insufficient samples show a labeled unavailable state.
22. A default-branch push deploys `dist` to the correct GitHub Pages base path only after lint, tests, rules tests, and build pass.
23. Two authenticated browser sessions receive Firestore changes in realtime without refreshing.
24. `npm run lint`, `npm test -- --run`, `npm run test:rules`, and `npm run build` all exit successfully.

# Verification Steps

1. Local static checks:
   - `npm ci`
   - `npm run lint`
   - `npm test -- --run`
   - `npm run build`
2. Emulator compatibility:
   - Seed records containing only `startedAt`, `endedAt`, and `isEnded: true`, including all four observed UTC hours.
   - Run `npm run test:rules` and repository integration tests.
   - Verify missing comments, optional comments, malformed schemas, two authenticated users, merges, and deletes.
3. Existing project read-only smoke test:
   - Authenticate with the registered Web App.
   - Confirm the observed document count and schema load without writes.
   - Compare normalized ordering/count to a read-only Admin aggregate; never print actual dates/comments in logs.
4. Controlled production mutation:
   - Create a uniquely identifiable temporary period that cannot touch existing data.
   - Edit its comment and dates, verify another session updates, then delete it through the UI.
   - Confirm the pre-existing document count/content returns to the baseline.
5. Pages/auth:
   - Configure GitHub repository variables and Pages source.
   - Verify both `/<repository>/` asset loading and direct refresh.
   - Test Google popup sign-in/sign-out and popup error recovery on desktop plus a real iOS/Android browser.
6. Calendar edge cases:
   - Test leap day, year boundary, DST dates, reversed taps, left/right adjacency, bridging multiple periods, 2,000/2,001-character comments, exactly 14 vs 15 days, and sparse prediction history.
7. Accessibility/responsiveness:
   - Test 320, 390, 768, and desktop widths.
   - Verify 44×44 px date targets, keyboard-only operation, accessible date labels/dialog focus, visible focus, and reduced motion.

# Risks & Mitigations

- **Admin credential exposure:** the existing service-account JSON contains a private key and bypasses Firestore rules. Never place it in the target repository, client environment, GitHub, or build; use it only for explicitly approved administrative/read-only setup outside the browser.
- **Legacy date drift:** browser-local conversion would shift some 21:00–23:00 UTC records to the wrong day. Centralize nearest-midnight UTC normalization and test every observed timestamp hour.
- **Rule tightening can affect unknown clients:** current rules authorize all authenticated paths. Only one root collection exists and Admin utilities bypass rules, but deploy rules separately, test legacy writes, and retain rollback instructions.
- **No registered Web App:** the service account cannot replace browser config. Register one Web App before frontend integration and add the Pages host to authorized domains.
- **Cross-document overlap is not enforceable purely by rules:** Firestore rules cannot scan the collection, and simultaneous clients can race. Recompute against the latest snapshot, write touched documents atomically, listen in realtime, test two-client behavior, and document that strict adversarial guarantees require a trusted backend or single-document model.
- **GitHub Pages cannot proxy Firebase redirect helpers:** use Google popup auth directly from a user gesture and provide retry guidance; use Firebase Hosting or a proxy-capable host if redirect auth later becomes mandatory.
- **Production data is sensitive:** tests and diagnostics must report only counts/schema classifications, never dates, comments, document IDs, or credential values; use emulators for destructive/edge-case coverage and one isolated temporary record for final smoke testing.
