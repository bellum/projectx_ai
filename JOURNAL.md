# Implementation journal

## 2026-08-30 — Initial implementation

### Completed

- Created the React/Vite/TypeScript project foundation, lint/test configuration, public environment template, and reproducible npm lockfile.
- Implemented UTC date-only conversion for legacy Firestore timestamps and canonical UTC-midnight writes.
- Implemented period range normalization, adjacency/overlap merging, chronological comment combination, and both requested prediction calculations.
- Added Firebase client initialization, Google popup authentication, realtime `periods` subscription, batched create/edit/merge writes, and deletion.
- Added responsive two-month calendar, editor, deletion confirmation, and prediction UI.
- Added narrowed Firestore rules, emulator configuration, rules tests, Pages workflow, and setup/rollback documentation.

### Verification status

- `npm install --package-lock-only` completed successfully (the package lock is present).
- `npm ci`, `npm run lint`, `npm test -- --run`, and `npm run build` complete successfully. The unit/component suite contains 17 passing tests across eight files.
- The Firestore emulator's Java dependency was installed locally and `npm run test:rules` completes successfully: 2 rules tests pass using only emulator data.
- Initial dependency resolution reported an engine warning for `jsdom` under Node 24.8.0; this does not by itself indicate a project failure.

### Remaining work

- Local implementation and verification are complete. The production setup items below remain intentionally pending external approval/access.
- External, deliberately not performed: register the Firebase Web App, authorize the final GitHub Pages domain for Google Auth, configure GitHub variables, deploy Firestore rules, and execute live-data smoke/mutation checks. These actions change external state and require project access/approval.

### Local demo runtime

- Created a git-ignored emulator-only `.env.local` with non-production placeholder browser configuration.
- Started local Firebase Auth and Firestore emulators and the Vite development server. The app is available at `http://127.0.0.1:5173/` and uses a local-only emulator database.
- Production Firebase Auth custom claims are not available in this local emulator configuration; test them by running the browser with real public Web App configuration and `VITE_USE_EMULATORS=false`.
- Confirmed the local browser is now configured with complete public production Web App values and `VITE_USE_EMULATORS=false`. The auth provider now force-refreshes the ID token after sign-in so a newly granted custom claim is applied immediately.

### Local backup import

- Validated and imported all 383 backup records from `periods.json.bak` into the local Firestore emulator, preserving document IDs and legacy fields without logging values.
- Removed the three pre-existing extra documents after confirmation. Aggregate verification now confirms an exact local match: 383 backup records, 383 emulator records, zero missing, and zero extra.

### Calendar default adjustment

- Changed the default visible pair from previous/current to current/next month so predicted upcoming dates are visible immediately. Older pairs remain reachable; forward browsing still stops at the current/next pair.
- Changed unmarked-date interaction so a single tap opens a one-day draft immediately; pointer dragging across days opens an inclusive range draft without triggering the one-day action.
- Added a live highlighted preview while dragging, constrained popup date controls within the editor, and compacted same-year calendar headings to show the year only once.
- Removed the secondary delete confirmation. Delete is now an immediate red action on the same non-wrapping row as Cancel and Save.
- Positioned Delete at the left of the editor action row while retaining neutral Cancel and primary Save styling.

### Deployment documentation

- Added `DEPLOYMENT.md` with the GitHub Pages, public Firebase Web App configuration, Auth authorized-domain, rules deployment, rollback, and post-deployment verification runbook.
- Corrected the Pages workflow's `environment` declaration so the GitHub Actions expression is parsed as a YAML scalar instead of an invalid inline mapping value.
- Deployment safety audit found that the period backup is absent from the current tree but present in two historical commits. Do not make this repository public unless that sensitive history is deliberately rewritten and the remote history is replaced.

### Access control

- Replaced the public email allowlist with the private Firebase Auth `calendarAccess: true` custom claim. The browser signs out accounts without the claim, while Firestore Rules enforce it for every read and write.
- Confirmed the custom-claim model as the selected production authorization approach. The Firebase Console must use the matching claim-based rules, and approved accounts must receive the claim from a trusted Admin SDK environment before login can succeed.
- Isolated the rules test emulator ports from the local preview so allowlist checks can run without affecting its imported data.
- Verified the allowlist: the isolated emulator rules suite passes, and a read-only check confirms the running preview emulator denies an unapproved authenticated email.

### Privacy cleanup

- Replaced the local account name in the planning document's historical utility-repository paths with repository-neutral placeholders. No application, deployment, or configuration file contained that name.
- Added explicit ignore rules for the local period backup and common Admin credential filenames to reduce the risk of accidentally committing sensitive material.
