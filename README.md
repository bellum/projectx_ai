# Periods calendar

Mobile-first shared period calendar for the existing `projectx-d645c` Firebase project. It reads the established `periods` collection directly; legacy documents need no migration.

Access is limited to Firebase Auth accounts provisioned with the private `calendarAccess: true` custom claim. Firebase Rules enforce this server-side; the browser also signs out accounts without that claim with an explanatory message.

## Safe setup

1. In Firebase Console, register a **Web App** in `projectx-d645c` and copy only its public web configuration into a local `.env` based on `.env.example`.
2. Enable Google in Firebase Authentication and add `<username>.github.io` to Authorized domains. The domain does not include the repository path.
3. Set matching `VITE_FIREBASE_*` repository variables in GitHub Actions. Set `VITE_BASE_PATH` to `/projectx_ai/` for project Pages, or `/` for a custom domain.
4. Run `npm ci`, then `npm run dev`.

The Firebase web configuration is intended for browser use. Never copy an Admin SDK service-account JSON, private key, or any credential from the utility repository into this project, Actions variables/secrets, or a Pages build. Admin credentials bypass Firestore rules.

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
