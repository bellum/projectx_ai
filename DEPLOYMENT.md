# Deployment runbook

This application deploys to GitHub Pages and connects directly to the existing Firebase project. GitHub Pages hosts only the static browser build; Firebase provides Google Authentication and Firestore.

## Credential boundary

Firebase Web App configuration is public browser configuration, not a secret. Values prefixed `VITE_` are compiled into the deployed JavaScript and can be inspected by visitors. Use GitHub **Actions Variables** for those values to keep them out of source control, but do not treat them as confidential.

Never place an Admin service-account JSON, private key, Firebase Admin SDK credential, or the utility repository's service account in this repository, a Vite environment file, GitHub Actions variables/secrets, or the Pages artifact. Admin credentials bypass Firestore rules.

Calendar access is limited to users provisioned with the private Firebase Auth custom claim `calendarAccess: true`. Firestore Rules enforce that claim for every request. The browser additionally signs out accounts without the claim for a clearer user experience; this client check is not the security boundary.

Set that claim only from a trusted Admin SDK environment, never from the browser or GitHub Pages build. An administrator can look up a user by email and grant access with:

```js
const user = await admin.auth().getUserByEmail(process.env.CALENDAR_USER_EMAIL)
await admin.auth().setCustomUserClaims(user.uid, { calendarAccess: true })
```

Use one trusted invocation per approved person. Keep the email value in the administrator's local environment or secure identity-management process—not in this repository. Users must sign out and sign in again after the claim is granted or changed to receive a refreshed ID token.

Before deploying, check the tracked source contains no privileged credential:

```sh
git grep -n -i 'private_key\|service_account\|firebase-admin'
```

## One-time Firebase setup

1. In Firebase Console, open project `projectx-d645c` and register a **Web App**.
2. Copy only its public configuration values.
3. Enable the Google provider in Firebase Authentication if it is not already enabled.
4. In Firebase Authentication → Settings → Authorized domains, add `<github-username>.github.io`. Add only the hostname, never the repository path.

## GitHub Actions configuration

In repository Settings → Secrets and variables → Actions → **Variables**, add the following public Web App configuration values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

The supplied workflow uses the project Pages base path `/projectx_ai/`. If the repository is renamed, update `VITE_BASE_PATH` in the build step of [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) to `/<repository-name>/`. Use `/` only for a user/organization Pages site or custom domain.

In repository Settings → Pages, set the publishing source to **GitHub Actions**.

## Publish Pages

Push the desired commit to `main`:

```sh
git push origin main
```

The workflow in [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml) uses `npm ci`, runs lint/unit/emulator-rules tests and the production build, then deploys `dist`. A failed check prevents publication.

For a project Pages site, the result is available at:

```
https://<github-username>.github.io/projectx_ai/
```

## Deploy Firestore rules separately

The Pages workflow intentionally does not deploy Firestore rules. Deploy them separately after confirming there are no unknown authenticated clients outside the calendar:

```sh
npx firebase-tools login
npx firebase-tools use projectx-d645c
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

The rules in [firestore.rules](firestore.rules) allow authenticated access only to schema-valid documents under `periods/{periodId}`. If an unknown dependency fails after deployment, restore the previous ruleset from Firebase Console's rules history while investigating. Firebase Admin utilities are unaffected by Firestore rules.

## Post-deploy verification

1. Open the Pages URL and confirm assets load under the project subpath.
2. Sign in with Google; popup authentication must succeed on the authorized Pages hostname.
3. Confirm existing periods load read-only before performing an edit.
4. Use an isolated, non-touching temporary period for create/edit/delete testing, then remove it.
5. Confirm a second signed-in session receives the update in realtime.
6. Check the deployed JavaScript does not contain privileged credential material:

```sh
rg -n -i 'private_key|service_account|firebase-admin|BEGIN.*PRIVATE' dist
```
