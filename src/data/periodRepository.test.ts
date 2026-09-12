import { Timestamp } from 'firebase/firestore'
import { vi } from 'vitest'
import type { PeriodDraft } from '../types/period'

const firestore = vi.hoisted(() => ({ batch: { set: vi.fn(), delete: vi.fn(), commit: vi.fn() }, makeDoc: vi.fn((_parent: unknown, id?: string, childId?: string) => ({ id: childId ?? id ?? 'created' })), snapshot: vi.fn(), getDocs: vi.fn() }))
vi.mock('../lib/firebase', () => ({ db: {} }))
vi.mock('firebase/firestore', async importOriginal => {
  const actual = await importOriginal<typeof import('firebase/firestore')>()
  return { ...actual, collection: vi.fn(() => ({ path: 'periods' })), doc: firestore.makeDoc, onSnapshot: firestore.snapshot, orderBy: vi.fn(), query: vi.fn(), getDocs: firestore.getDocs, writeBatch: vi.fn(() => firestore.batch), serverTimestamp: vi.fn(() => 'server-time') }
})
const { savePeriod } = await import('./periodRepository')
describe('period repository', () => {
  beforeEach(() => { firestore.getDocs.mockReset().mockResolvedValue({ docs: [] }); firestore.batch.set.mockReset(); firestore.batch.delete.mockReset(); firestore.batch.commit.mockReset().mockResolvedValue(undefined); firestore.makeDoc.mockImplementation((_parent: unknown, id?: string, childId?: string) => ({ id: childId ?? id ?? 'created' })) })
  it('writes canonical timestamps and refreshes analytics for an isolated new period', async () => { const draft: PeriodDraft = { start: '2024-02-29', end: '2024-03-01', comment: '', touchedIds: [], merged: false }; await savePeriod(draft); expect(firestore.batch.set).toHaveBeenCalledWith({ id: 'created' }, expect.objectContaining({ isEnded: true, startedAt: expect.any(Timestamp) })); expect(firestore.batch.set.mock.calls[0][1].startedAt.toDate().toISOString()).toBe('2024-02-29T00:00:00.000Z'); expect(firestore.batch.set).toHaveBeenCalledWith(expect.objectContaining({ id: 'summary' }), expect.objectContaining({ periodCount: 1, gaps: [] })) })
  it('retains the earliest touched id, deletes merged records, and refreshes analytics', async () => { await savePeriod({ start: '2024-02-01', end: '2024-02-10', comment: 'merged', touchedIds: ['early', 'later'], merged: true }); expect(firestore.batch.set.mock.calls[0][0]).toEqual({ id: 'early' }); expect(firestore.batch.delete).toHaveBeenCalledWith({ id: 'later' }); expect(firestore.batch.set).toHaveBeenCalledWith(expect.objectContaining({ id: 'summary' }), expect.objectContaining({ periodCount: 1 })) })
})
