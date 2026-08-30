import { Timestamp } from 'firebase/firestore'
import { vi } from 'vitest'
import type { PeriodDraft } from '../types/period'

const firestore = vi.hoisted(() => ({ batch: { set: vi.fn(), delete: vi.fn(), commit: vi.fn() }, makeDoc: vi.fn(), snapshot: vi.fn() }))
vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return { ...actual, collection: vi.fn(() => ({ path: 'periods' })), doc: firestore.makeDoc, writeBatch: vi.fn(() => firestore.batch), deleteDoc: vi.fn(), onSnapshot: firestore.snapshot, orderBy: vi.fn(), query: vi.fn() }
})
const { savePeriod } = await import('./periodRepository')
describe('period repository', () => {
  beforeEach(() => { firestore.batch.set.mockReset(); firestore.batch.delete.mockReset(); firestore.batch.commit.mockReset().mockResolvedValue(undefined); firestore.makeDoc.mockImplementation((_collection: unknown, id?: string) => ({ id: id ?? 'created' })) })
  it('writes canonical timestamps for an isolated new period', async () => { const draft: PeriodDraft = { start: '2024-02-29', end: '2024-03-01', comment: '', touchedIds: [], merged: false }; await savePeriod(draft); expect(firestore.batch.set).toHaveBeenCalledWith({ id: 'created' }, expect.objectContaining({ isEnded: true, startedAt: expect.any(Timestamp) })); expect(firestore.batch.set.mock.calls[0][1].startedAt.toDate().toISOString()).toBe('2024-02-29T00:00:00.000Z') })
  it('retains the earliest touched id and deletes merged records', async () => { await savePeriod({ start: '2024-02-01', end: '2024-02-10', comment: 'merged', touchedIds: ['early', 'later'], merged: true }); expect(firestore.batch.set.mock.calls[0][0]).toEqual({ id: 'early' }); expect(firestore.batch.delete).toHaveBeenCalledWith({ id: 'later' }); expect(firestore.batch.commit).toHaveBeenCalledOnce() })
})
