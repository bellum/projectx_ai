import { readFile } from 'node:fs/promises'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

function environmentValue(text, key) {
  const line = text.split(/\r?\n/).find((item) => item.startsWith(`${key}=`))
  return line?.slice(key.length + 1).trim()
}
function isoDay(timestamp) { return new Date(timestamp.toMillis() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10) }
function dayTimestamp(day) { return Timestamp.fromDate(new Date(`${day}T00:00:00.000Z`)) }
function daysBetween(first, second) { return Math.round((Date.parse(`${second}T00:00:00.000Z`) - Date.parse(`${first}T00:00:00.000Z`)) / 86_400_000) }

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to an Admin service-account file stored outside this repository.')
const localEnvironment = await readFile('.env.local', 'utf8').catch(() => '')
const projectId = process.env.GOOGLE_CLOUD_PROJECT || environmentValue(localEnvironment, 'VITE_FIREBASE_PROJECT_ID')
if (!projectId) throw new Error('Set GOOGLE_CLOUD_PROJECT or VITE_FIREBASE_PROJECT_ID before running the analytics migration.')

initializeApp({ credential: applicationDefault(), projectId })
const database = getFirestore(), snapshot = await database.collection('periods').orderBy('startedAt').get()
const periods = snapshot.docs.map((item) => {
  const data = item.data()
  if (!(data.startedAt instanceof Timestamp) || !(data.endedAt instanceof Timestamp) || data.isEnded !== true) throw new Error('A period document has an unsupported schema; migration stopped without writing analytics.')
  return { id: item.id, start: isoDay(data.startedAt), end: isoDay(data.endedAt) }
})
const intervals = periods.slice(1).map((period, index) => ({ periodId: period.id, previousStartedAt: dayTimestamp(periods[index].start), startedAt: dayTimestamp(period.start), endedAt: dayTimestamp(period.end), intervalDays: daysBetween(periods[index].end, period.start) }))
const latest = periods.at(-1)
await database.doc('periodAnalytics/summary').set({ schemaVersion: 1, periodCount: periods.length, ...(latest ? { latestPeriodId: latest.id, latestStartedAt: dayTimestamp(latest.start), latestEndedAt: dayTimestamp(latest.end) } : {}), intervals, updatedAt: Timestamp.now() })
console.log(JSON.stringify({ migratedPeriods: periods.length, storedIntervals: intervals.length }))
