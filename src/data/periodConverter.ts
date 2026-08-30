import type { FirestoreDataConverter, QueryDocumentSnapshot, SnapshotOptions } from 'firebase/firestore'
import type { RawPeriodRecord, Period } from '../types/period'
import { timestampToIsoDay } from '../domain/dateUtils'

export function normalizeRecord(id: string, raw: unknown): Period {
  const value = raw as Partial<RawPeriodRecord>
  if (!value.startedAt || typeof (value.startedAt as { toMillis?: unknown }).toMillis !== 'function' || !value.endedAt || typeof (value.endedAt as { toMillis?: unknown }).toMillis !== 'function' || value.isEnded !== true || (value.comment !== undefined && typeof value.comment !== 'string')) throw new Error(`Malformed period document: ${id}`)
  return { id, start: timestampToIsoDay(value.startedAt), end: timestampToIsoDay(value.endedAt), comment: value.comment ?? '' }
}
export const periodConverter: FirestoreDataConverter<Period> = {
  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Period { return normalizeRecord(snapshot.id, snapshot.data(options)) },
  toFirestore(): never { throw new Error('Use periodRepository for writes.') }
}
