import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { Timestamp, collection, deleteDoc, doc, getDocs, writeBatch } from 'firebase/firestore'

const backupPath = new URL('../data/periods.json.bak', import.meta.url)
const environmentPath = new URL('../.env.local', import.meta.url)
const testEmail = 'test@gmail.com'
const testUserId = 'local-google-test-user'

function valueFromEnvironment(text, key) {
  const line = text.split(/\r?\n/).find((item) => item.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim()
}

async function waitFor(url) {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function seedPeriods(projectId) {
  const records = JSON.parse(await readFile(backupPath, 'utf8'))
  if (!Array.isArray(records) || records.some((record) => !record.doc_id || !record.startedAt || !record.endedAt || record.isEnded !== true)) {
    throw new Error('Run npm run data:reconcile first; data/periods.json.bak must contain legacy period records with doc_id, timestamps, and isEnded: true.')
  }

  const environment = await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080 } })
  try {
    await environment.withSecurityRulesDisabled(async (context) => {
      const database = context.firestore()
      const existing = await getDocs(collection(database, 'periods'))
      await Promise.all(existing.docs.map((snapshot) => deleteDoc(snapshot.ref)))

      for (let index = 0; index < records.length; index += 500) {
        const batch = writeBatch(database)
        for (const record of records.slice(index, index + 500)) {
          batch.set(doc(database, 'periods', record.doc_id), {
            startedAt: Timestamp.fromDate(new Date(record.startedAt)),
            endedAt: Timestamp.fromDate(new Date(record.endedAt)),
            isEnded: true,
          })
        }
        await batch.commit()
      }
      const normalized = records.map((record) => ({ id: record.doc_id, start: new Date(new Date(record.startedAt).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date(new Date(record.endedAt).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10) })).sort((first, second) => first.start.localeCompare(second.start) || first.end.localeCompare(second.end) || first.id.localeCompare(second.id))
      const latest = normalized.at(-1)
      const summary = writeBatch(database)
      summary.set(doc(database, 'periodAnalytics', 'summary'), {
        schemaVersion: 1,
        periodCount: normalized.length,
        ...(latest ? { latestPeriodId: latest.id, latestStartedAt: Timestamp.fromDate(new Date(`${latest.start}T00:00:00.000Z`)), latestEndedAt: Timestamp.fromDate(new Date(`${latest.end}T00:00:00.000Z`)) } : {}),
        intervals: normalized.slice(1).map((period, index) => ({ periodId: period.id, startedAt: Timestamp.fromDate(new Date(`${period.start}T00:00:00.000Z`)), endedAt: Timestamp.fromDate(new Date(`${period.end}T00:00:00.000Z`)), intervalDays: Math.round((Date.parse(`${period.start}T00:00:00.000Z`) - Date.parse(`${normalized[index].end}T00:00:00.000Z`)) / 86_400_000) })),
        updatedAt: Timestamp.now(),
      })
      await summary.commit()
    })
  } finally {
    await environment.cleanup()
  }
  return records.length
}

async function seedTestUser(projectId) {
  let status
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/accounts:batchCreate`, {
        method: 'POST',
        headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allowOverwrite: true,
          users: [{
            localId: testUserId,
            email: testEmail,
            emailVerified: true,
            displayName: 'Test user',
            customAttributes: JSON.stringify({ calendarAccess: true }),
            providerUserInfo: [{ providerId: 'google.com', rawId: testUserId, email: testEmail, displayName: 'Test user' }],
          }],
        }),
      })
      if (response.ok) return
      status = response.status
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
  throw new Error(`Unable to create the local test account${status ? ` (${status})` : ''}.`)
}

const environment = await readFile(environmentPath, 'utf8').catch(() => '')
const projectId = valueFromEnvironment(environment, 'VITE_FIREBASE_PROJECT_ID')
if (!projectId) throw new Error('Set VITE_FIREBASE_PROJECT_ID in .env.local before starting the local emulator.')
if (valueFromEnvironment(environment, 'VITE_USE_EMULATORS') !== 'true') throw new Error('Set VITE_USE_EMULATORS=true in .env.local before starting the local emulator.')

const command = process.platform === 'win32' ? 'npx.cmd' : 'npx'
const homebrewJavaBin = '/opt/homebrew/opt/openjdk/bin'
const path = existsSync(homebrewJavaBin) ? `${homebrewJavaBin}:${process.env.PATH ?? ''}` : process.env.PATH
const emulator = spawn(command, ['firebase-tools', 'emulators:start', '--project', projectId], { stdio: 'inherit', env: { ...process.env, PATH: path } })
let shuttingDown = false
const stop = () => {
  if (!shuttingDown) {
    shuttingDown = true
    emulator.kill('SIGTERM')
  }
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)

try {
  await Promise.all([waitFor('http://127.0.0.1:8080/'), waitFor('http://127.0.0.1:9099/')])
  const imported = await seedPeriods(projectId)
  await seedTestUser(projectId)
  console.log(`Local emulator ready: ${imported} periods imported and ${testEmail} has calendarAccess.`)
} catch (error) {
  stop()
  throw error
}

await new Promise((resolve, reject) => emulator.once('exit', (code) => code === 0 || shuttingDown ? resolve() : reject(new Error(`Firebase emulator exited with code ${code}.`))))
