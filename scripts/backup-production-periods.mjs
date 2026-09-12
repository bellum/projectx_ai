import { mkdir, writeFile } from 'node:fs/promises'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const expectedProjectId = 'projectx-d645c'
const backupDirectory = new URL('../data/', import.meta.url)

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to an Admin service-account file stored outside this repository.')
if (process.env.GOOGLE_CLOUD_PROJECT !== expectedProjectId) throw new Error(`Set GOOGLE_CLOUD_PROJECT=${expectedProjectId}; refusing to run against an implicit or different project.`)
initializeApp({ credential: applicationDefault(), projectId: expectedProjectId })
const snapshot = await getFirestore().collection('periods').orderBy('startedAt').get()
const records = snapshot.docs.map(item => {
  const data = item.data()
  if (!(data.startedAt instanceof Timestamp) || !(data.endedAt instanceof Timestamp) || data.isEnded !== true || typeof data.comment !== 'undefined' && typeof data.comment !== 'string') {
    throw new Error('A live period has an unsupported schema; no backup was written.')
  }
  return { doc_id: item.id, startedAt: data.startedAt.toDate().toISOString(), endedAt: data.endedAt.toDate().toISOString(), isEnded: true, ...(data.comment ? { comment: data.comment } : {}) }
})
await mkdir(backupDirectory, { recursive: true })
const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
const filename = `backup-${timestamp}.json`
await writeFile(new URL(filename, backupDirectory), `${JSON.stringify(records, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ backupCreated: true, periods: records.length, filename }))
