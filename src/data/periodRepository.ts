import { collection, deleteDoc, doc, onSnapshot, orderBy, query, writeBatch } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { isoDayToTimestamp } from '../domain/dateUtils'
import { normalizeRecord } from './periodConverter'
import type { Period, PeriodDraft } from '../types/period'

const periods = collection(db, 'periods')
function payload(draft: PeriodDraft) { return { startedAt: isoDayToTimestamp(draft.start), endedAt: isoDayToTimestamp(draft.end), isEnded: true as const, ...(draft.comment.trim() ? { comment: draft.comment.trim() } : {}) } }
export function subscribePeriods(onData: (periods: Period[]) => void, onError: (error: Error) => void): () => void { return onSnapshot(query(periods, orderBy('startedAt')), snapshot => onData(snapshot.docs.map(item => normalizeRecord(item.id, item.data()))), error => onError(error)) }
export async function savePeriod(draft: PeriodDraft): Promise<void> {
  const batch = writeBatch(db)
  const keepId = draft.id ?? draft.touchedIds[0] ?? doc(periods).id
  batch.set(doc(periods, keepId), payload(draft))
  draft.touchedIds.filter(id => id !== keepId).forEach(id => batch.delete(doc(periods, id)))
  await batch.commit()
}
export async function removePeriod(id: string): Promise<void> { await deleteDoc(doc(periods, id)) }
