import { readFile, writeFile } from 'node:fs/promises'

const sourcePath = new URL('../data/original_periods.json.bak', import.meta.url)
const outputPath = new URL('../data/periods.json.bak', import.meta.url)
const dayMilliseconds = 86_400_000

function isoDay(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) throw new Error('The source backup contains an invalid timestamp.')
  return new Date(date.getTime() + 12 * 60 * 60 * 1000).toISOString().slice(0, 10)
}
function daysBetween(first, second) { return Math.round((Date.parse(`${second}T00:00:00.000Z`) - Date.parse(`${first}T00:00:00.000Z`)) / dayMilliseconds) }
function canonicalTimestamp(day) { return `${day}T00:00:00.000Z` }

const source = JSON.parse(await readFile(sourcePath, 'utf8'))
if (!Array.isArray(source) || source.some(record => !record?.doc_id || !record.startedAt || !record.endedAt || record.isEnded !== true)) {
  throw new Error('data/original_periods.json.bak must contain legacy records with doc_id, timestamps, and isEnded: true.')
}

const sorted = source.map(record => ({ id: record.doc_id, start: isoDay(record.startedAt), end: isoDay(record.endedAt) })).sort((first, second) => first.start.localeCompare(second.start) || first.end.localeCompare(second.end) || first.id.localeCompare(second.id))
if (sorted.some(record => record.start > record.end)) throw new Error('The source backup contains a period whose start is after its end.')

const reconciled = []
for (const period of sorted) {
  const current = reconciled.at(-1)
  if (!current || daysBetween(current.end, period.start) > 1) {
    reconciled.push({ id: period.id, start: period.start, end: period.end, sourceCount: 1 })
    continue
  }
  current.end = current.end > period.end ? current.end : period.end
  current.sourceCount += 1
}

const output = reconciled.map(period => ({ doc_id: period.id, startedAt: canonicalTimestamp(period.start), endedAt: canonicalTimestamp(period.end), isEnded: true }))
await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8')
console.log(JSON.stringify({ sourcePeriods: sorted.length, reconciledPeriods: output.length, mergedGroups: reconciled.filter(period => period.sourceCount > 1).length, removedPeriods: sorted.length - output.length, output: 'data/periods.json.bak' }))
