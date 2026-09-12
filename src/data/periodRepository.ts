import { collection, doc, getDocs, onSnapshot, orderBy, query, where, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { isoDayToTimestamp } from '../domain/dateUtils'
import { buildPeriodAnalytics } from '../domain/analytics'
import { analyticsPayload, analyticsSummary } from './analyticsRepository'
import { normalizeRecord } from './periodConverter'
import type { Period, PeriodDraft } from '../types/period'

const periods = collection(db, 'periods')
function payload(draft: PeriodDraft) { return { startedAt: isoDayToTimestamp(draft.start), endedAt: isoDayToTimestamp(draft.end), isEnded: true as const, ...(draft.comment.trim() ? { comment: draft.comment.trim() } : {}) } }
export function subscribePeriods(from: import('../types/period').IsoDate, to: import('../types/period').IsoDate, onData: (periods: Period[]) => void, onError: (error: Error) => void): () => void { return onSnapshot(query(periods, where('startedAt', '>=', isoDayToTimestamp(from)), where('startedAt', '<=', isoDayToTimestamp(to)), orderBy('startedAt')), snapshot => onData(snapshot.docs.map(item => normalizeRecord(item.id, item.data()))), error => onError(error)) }
export async function savePeriod(draft: PeriodDraft): Promise<void> {
  const snapshot = await getDocs(query(periods, orderBy('startedAt')))
  const existing = snapshot.docs.map(item => normalizeRecord(item.id, item.data())), batch = writeBatch(db)
  const keepId = draft.id ?? draft.touchedIds[0] ?? doc(periods).id
  const next = [...existing.filter(period => !draft.touchedIds.includes(period.id) && period.id !== keepId), { id: keepId, start: draft.start, end: draft.end, comment: draft.comment.trim() }]
  batch.set(doc(periods, keepId), payload(draft))
  draft.touchedIds.filter(id => id !== keepId).forEach(id => batch.delete(doc(periods, id)))
  batch.set(analyticsSummary, analyticsPayload(buildPeriodAnalytics(next)))
  await batch.commit()
}
export async function removePeriod(id: string): Promise<void> {
  const snapshot = await getDocs(query(periods, orderBy('startedAt')))
  const next = snapshot.docs.map(item => normalizeRecord(item.id, item.data())).filter(period => period.id !== id), batch = writeBatch(db)
  batch.delete(doc(periods, id))
  batch.set(analyticsSummary, analyticsPayload(buildPeriodAnalytics(next)))
  await batch.commit()
}
