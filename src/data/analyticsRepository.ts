import { doc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { isoDayToTimestamp, timestampToIsoDay } from '../domain/dateUtils'
import { db } from '../lib/firebase'
import type { IntervalSample, PeriodAnalytics } from '../types/period'

export const analyticsSummary = doc(db, 'periodAnalytics', 'summary')

export function analyticsPayload(analytics: PeriodAnalytics) {
  return {
    schemaVersion: 1,
    periodCount: analytics.periodCount,
    ...(analytics.latest ? { latestPeriodId: analytics.latest.id, latestStartedAt: isoDayToTimestamp(analytics.latest.start), latestEndedAt: isoDayToTimestamp(analytics.latest.end) } : {}),
    intervals: analytics.intervals.map(sample => ({ periodId: sample.periodId, startedAt: isoDayToTimestamp(sample.start), endedAt: isoDayToTimestamp(sample.end), intervalDays: sample.intervalDays })),
    updatedAt: serverTimestamp(),
  }
}

function timestamp(value: unknown): value is { toMillis(): number } { return Boolean(value) && typeof (value as { toMillis?: unknown }).toMillis === 'function' }
function interval(value: unknown): IntervalSample {
  const raw = value as { periodId?: unknown; startedAt?: unknown; endedAt?: unknown; intervalDays?: unknown }
  const intervalDays = raw.intervalDays
  if (typeof raw.periodId !== 'string' || !timestamp(raw.startedAt) || !timestamp(raw.endedAt) || typeof intervalDays !== 'number' || !Number.isInteger(intervalDays)) throw new Error('Malformed period analytics data.')
  return { periodId: raw.periodId, start: timestampToIsoDay(raw.startedAt as never), end: timestampToIsoDay(raw.endedAt as never), intervalDays }
}
export function normalizeAnalytics(raw: unknown): PeriodAnalytics {
  const value = raw as { schemaVersion?: unknown; periodCount?: unknown; latestPeriodId?: unknown; latestStartedAt?: unknown; latestEndedAt?: unknown; intervals?: unknown }
  const periodCount = value.periodCount
  if (value.schemaVersion !== 1 || typeof periodCount !== 'number' || !Number.isInteger(periodCount) || periodCount < 0 || !Array.isArray(value.intervals)) throw new Error('Malformed period analytics data.')
  const hasLatest = value.latestPeriodId !== undefined || value.latestStartedAt !== undefined || value.latestEndedAt !== undefined
  if (hasLatest && (typeof value.latestPeriodId !== 'string' || !timestamp(value.latestStartedAt) || !timestamp(value.latestEndedAt))) throw new Error('Malformed period analytics data.')
  if (!hasLatest && periodCount !== 0) throw new Error('Malformed period analytics data.')
  return { periodCount, latest: hasLatest ? { id: value.latestPeriodId as string, start: timestampToIsoDay(value.latestStartedAt as never), end: timestampToIsoDay(value.latestEndedAt as never) } : undefined, intervals: value.intervals.map(interval) }
}
export function subscribePeriodAnalytics(onData: (value: PeriodAnalytics | undefined) => void, onError: (error: Error) => void): () => void {
  return onSnapshot(analyticsSummary, snapshot => onData(snapshot.exists() ? normalizeAnalytics(snapshot.data()) : undefined), onError)
}
