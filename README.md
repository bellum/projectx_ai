# Periods calendar

Mobile-first shared period calendar for the existing `projectx-d645c` Firebase project. It reads the established `periods` collection directly; legacy documents need no migration.

Access is limited to Firebase Auth accounts provisioned with the private `calendarAccess: true` custom claim. Firebase Rules enforce this server-side; the browser also signs out accounts without that claim with an explanatory message.

## Safe setup

1. In Firebase Console, register a **Web App** in `projectx-d645c` and copy only its public web configuration into a local `.env` based on `.env.example`.
2. Enable Google in Firebase Authentication and add `<username>.github.io` to Authorized domains. The domain does not include the repository path.
3. Set matching `VITE_FIREBASE_*` repository variables in GitHub Actions. Set `VITE_BASE_PATH` to `/projectx_ai/` for project Pages, or `/` for a custom domain.
4. Run `npm ci`, then `npm run dev`.

## Local emulator demo

With `VITE_USE_EMULATORS=true` in `.env.local` and a local `data/periods.json.bak` file, run this in one terminal:

```sh
npm run emulator:seed
```

The command starts local Auth and Firestore emulators, replaces only the local `periods` collection with the backup, builds its local analytics summary, and creates the local Google-popup account `test@gmail.com` with `calendarAccess: true`. In the Google emulator popup, choose that listed test account. Run `npm run dev` in another terminal. This process never contacts the production Firebase project or uses an Admin credential.

The Firebase web configuration is intended for browser use. Never copy an Admin SDK service-account JSON, private key, or any credential from the utility repository into this project, Actions variables/secrets, or a Pages build. Admin credentials bypass Firestore rules.

## Analytics migration

The calendar stores one derived `periodAnalytics/summary` document containing normalized period gaps. This avoids loading historical periods to calculate predictions and powers the Insights chart. Deploy the updated Firestore Rules, then run this one-time backfill from a trusted machine:

```sh
GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/outside/this/repository/service-account.json npm run migrate:analytics
```

The script reads the existing periods and writes only the derived analytics summary; it does not edit or log any period dates, comments, or document IDs. The Admin credential remains outside the repository and is never used by the browser. Later create, edit, merge, and delete operations refresh the summary in their same Firestore batch.

## Verification and deployment

Run `npm run lint`, `npm test -- --run`, `npm run test:rules`, and `npm run build`. Rules tests use isolated local Auth and Firestore emulator ports, so they do not alter an active local preview; the first run downloads emulator binaries.

Deploy rules separately, after checking any unknown clients:

```sh
npx firebase-tools use projectx-d645c
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

The GitHub workflow deploys `dist` after all checks pass. If narrowed rules uncover an unknown client dependency, restore the prior broad ruleset from Firebase Console/version history before investigating; Firebase Admin utilities are unaffected by rules.

Before production mutation, perform a read-only browser smoke check that reports only count/schema status. Use an isolated temporary non-touching record for a controlled create/edit/delete check, then confirm it is gone. Do not log sensitive dates, comments, document IDs, or credentials.

## Data behavior

Every period uses `startedAt`, `endedAt`, `isEnded: true`, and an optional `comment`. Legacy timestamp instants are normalized by adding twelve hours in UTC before selecting their day: `21:00`–`23:00` map forward and midnight remains on the same day. New writes are always UTC midnight. The UI batches normal merges, retaining the earliest touched document ID; simultaneous clients can still race because Firestore rules cannot query for cross-document overlaps.
