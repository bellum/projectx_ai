import { readFile, readdir } from 'node:fs/promises'
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Timestamp, getFirestore } from 'firebase-admin/firestore'

const expectedProjectId = 'projectx-d645c'
const confirmation = '--confirm=MERGE_OVERLAPPING_AND_ADJACENT_PERIODS'
const liveConfirmation = '--confirm=RECONCILE_CURRENT_LIVE_PERIODS'
const sourcePath = new URL('../data/original_periods.json.bak', import.meta.url)
const dataDirectory = new URL('../data/', import.meta.url)
const dayMilliseconds = 86_400_000
const argumentsSet = new Set(process.argv.slice(2))
const apply = argumentsSet.has('--apply')
const acceptLive = argumentsSet.has('--accept-live')

if (![...argumentsSet].every(argument => argument === '--dry-run' || argument === '--apply' || argument === '--accept-live' || argument === confirmation || argument === liveConfirmation)) throw new Error('Usage: npm run migrate:periods -- [--dry-run | --accept-live --dry-run | --apply --confirm=MERGE_OVERLAPPING_AND_ADJACENT_PERIODS [--accept-live --confirm=RECONCILE_CURRENT_LIVE_PERIODS]]')
if (apply && !argumentsSet.has(confirmation)) throw new Error(`Refusing to write without ${confirmation}.`)
if (apply && acceptLive && !argumentsSet.has(liveConfirmation)) throw new Error(`Refusing to reconcile mismatched live data without ${liveConfirmation}.`)
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) throw new Error('Set GOOGLE_APPLICATION_CREDENTIALS to an Admin service-account file stored outside this repository.')
if (process.env.GOOGLE_CLOUD_PROJECT !== expectedProjectId) throw new Error(`Set GOOGLE_CLOUD_PROJECT=${expectedProjectId}; refusing to run against an implicit or different project.`)

function isoDay(timestamp) {
  if (!(timestamp instanceof Timestamp)) throw new Error('A live document has a non-Timestamp date field.')
  return new Date(timestamp.toMillis() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function canonicalTimestamp(day) { return Timestamp.fromDate(new Date(`${day}T00:00:00.000Z`)) }
function daysBetween(first, second) { return Math.round((Date.parse(`${second}T00:00:00.000Z`) - Date.parse(`${first}T00:00:00.000Z`)) / dayMilliseconds) }
function assertFields(data) {
  const keys = Object.keys(data)
  if (keys.some(key => !['startedAt', 'endedAt', 'isEnded', 'comment'].includes(key)) || data.isEnded !== true || typeof data.comment !== 'undefined' && (typeof data.comment !== 'string' || data.comment.length > 2000)) {
    throw new Error('A live document has an unsupported schema; stopped without writing.')
  }
}
function livePeriod(snapshot) {
  const data = snapshot.data()
  assertFields(data)
  const start = isoDay(data.startedAt), end = isoDay(data.endedAt)
  if (start > end) throw new Error('A live document has a reversed date range; stopped without writing.')
  return { id: snapshot.id, start, end, startedAt: data.startedAt, endedAt: data.endedAt, comment: data.comment ?? '' }
}
function reconcile(periods) {
  const groups = []
  for (const period of [...periods].sort((first, second) => first.start.localeCompare(second.start) || first.end.localeCompare(second.end) || first.id.localeCompare(second.id))) {
    const current = groups.at(-1)
    if (!current || daysBetween(current.end, period.start) > 1) {
      groups.push({ start: period.start, end: period.end, periods: [period] })
      continue
    }
    current.end = current.end > period.end ? current.end : period.end
    current.periods.push(period)
  }
  return groups
}
function mergedComment(group) {
  const comment = group.periods.map(period => period.comment.trim()).filter(Boolean).join('\n\n')
  if (comment.length > 2000) throw new Error('A merged comment would exceed 2,000 characters; stopped without writing.')
  return comment
}
function summaryFor(groups) {
  const periods = groups.map(group => ({ id: group.periods[0].id, start: group.start, end: group.end }))
  const latest = periods.at(-1)
  return {
    schemaVersion: 1,
    periodCount: periods.length,
    ...(latest ? { latestPeriodId: latest.id, latestStartedAt: canonicalTimestamp(latest.start), latestEndedAt: canonicalTimestamp(latest.end) } : {}),
    intervals: periods.slice(1).map((period, index) => ({ periodId: period.id, startedAt: canonicalTimestamp(period.start), endedAt: canonicalTimestamp(period.end), intervalDays: daysBetween(periods[index].end, period.start) })),
    updatedAt: Timestamp.now(),
  }
}
function planFor(periods) {
  const groups = reconcile(periods), mergedGroups = groups.filter(group => group.periods.length > 1), deletes = mergedGroups.flatMap(group => group.periods.slice(1))
  for (const group of mergedGroups) mergedComment(group)
  const operations = mergedGroups.length + deletes.length + 1
  if (operations > 500) throw new Error('The planned transaction exceeds Firestore’s 500-operation limit; stopped without writing.')
  return { groups, mergedGroups, deletes, result: { sourcePeriods: periods.length, reconciledPeriods: groups.length, mergedGroups: mergedGroups.length, removedPeriods: deletes.length, plannedOperations: operations } }
}
async function loadLatestBackup() {
  const filename = (await readdir(dataDirectory)).filter(item => /^backup-\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z\.json$/.test(item)).sort().at(-1)
  if (!filename) throw new Error('Create a fresh data/backup-<UTC date and time>.json with npm run backup:periods before applying.')
  const records = JSON.parse(await readFile(new URL(filename, dataDirectory), 'utf8'))
  if (!Array.isArray(records) || records.some(record => !record?.doc_id || typeof record.startedAt !== 'string' || typeof record.endedAt !== 'string' || record.isEnded !== true || typeof record.comment !== 'undefined' && typeof record.comment !== 'string')) throw new Error('The newest production backup has an unsupported schema.')
  return { filename, records }
}
function compareWithBackup(live, records) {
  const backupById = new Map(records.map(record => [record.doc_id, record]))
  const liveById = new Map(live.map(period => [period.id, period]))
  const missingFromLive = records.filter(record => !liveById.has(record.doc_id)).length
  const unexpectedInLive = live.filter(period => !backupById.has(period.id)).length
  const changedRecords = live.filter(period => { const backup = backupById.get(period.id); return backup && (backup.startedAt !== period.startedAt.toDate().toISOString() || backup.endedAt !== period.endedAt.toDate().toISOString() || (backup.comment ?? '') !== period.comment) }).length
  return { matches: !missingFromLive && !unexpectedInLive && !changedRecords, backupPeriods: records.length, livePeriods: live.length, missingFromLive, unexpectedInLive, changedRecords }
}

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
if (!Array.isArray(source) || source.some(record => !record?.doc_id || !record.startedAt || !record.endedAt || record.isEnded !== true)) throw new Error('data/original_periods.json.bak has an unsupported schema.')
const sourceById = new Map(source.map(record => [record.doc_id, { start: new Date(new Date(record.startedAt).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10), end: new Date(new Date(record.endedAt).getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10) }]))
if (sourceById.size !== source.length) throw new Error('The original backup contains duplicate document IDs.')

initializeApp({ credential: applicationDefault(), projectId: expectedProjectId })
const database = getFirestore(), query = database.collection('periods').orderBy('startedAt'), snapshot = await query.get()
const live = snapshot.docs.map(livePeriod), latestBackup = await loadLatestBackup()
const liveById = new Map(live.map(period => [period.id, period]))
const missingFromLive = [...sourceById.keys()].filter(id => !liveById.has(id)).length
const unexpectedInLive = live.filter(period => !sourceById.has(period.id)).length
const changedRanges = live.filter(period => { const sourcePeriod = sourceById.get(period.id); return sourcePeriod && (sourcePeriod.start !== period.start || sourcePeriod.end !== period.end) }).length
const backupMatchesLive = !missingFromLive && !unexpectedInLive && !changedRanges
if (!backupMatchesLive && !acceptLive) {
  console.error(JSON.stringify({ status: 'mismatch', originalPeriods: source.length, livePeriods: live.length, missingFromLive, unexpectedInLive, changedRanges }))
  throw new Error('Live periods do not exactly match the original backup after normalization; stopped without writing.')
}
const backupComparison = compareWithBackup(live, latestBackup.records)
if (!backupComparison.matches) {
  console.error(JSON.stringify({ status: 'backup-mismatch', backupFilename: latestBackup.filename, ...backupComparison }))
  throw new Error('Live periods do not exactly match the newest data backup; stopped without writing.')
}
const plan = planFor(live)
const result = { ...plan.result, sourceVerification: backupMatchesLive ? 'original-backup-matched' : 'current-live-explicitly-accepted', liveBackupVerification: 'matched', liveBackupFilename: latestBackup.filename }

if (!apply) {
  console.log(JSON.stringify({ status: 'dry-run', ...result }))
  process.exit(0)
}

const appliedResult = await database.runTransaction(async transaction => {
  const fresh = (await transaction.get(query)).docs.map(livePeriod)
  const freshBackupComparison = compareWithBackup(fresh, latestBackup.records)
  if (!freshBackupComparison.matches) throw new Error('Live periods changed after the preflight backup; stopped without writing.')
  const freshPlan = planFor(fresh)
  for (const group of freshPlan.mergedGroups) {
    const retained = group.periods[0], comment = mergedComment(group)
    transaction.set(database.collection('periods').doc(retained.id), { startedAt: canonicalTimestamp(group.start), endedAt: canonicalTimestamp(group.end), isEnded: true, ...(comment ? { comment } : {}) })
  }
  for (const period of freshPlan.deletes) transaction.delete(database.collection('periods').doc(period.id))
  transaction.set(database.doc('periodAnalytics/summary'), summaryFor(freshPlan.groups))
  return freshPlan.result
})
console.log(JSON.stringify({ status: 'applied', ...appliedResult, sourceVerification: result.sourceVerification, liveBackupVerification: 'matched', liveBackupFilename: latestBackup.filename }))
