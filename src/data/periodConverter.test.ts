import { Timestamp } from 'firebase/firestore'
import { normalizeRecord } from './periodConverter'
describe('period converter', () => {
  it('reads a commentless legacy document', () => expect(normalizeRecord('legacy', { startedAt: Timestamp.fromDate(new Date('2024-01-01T23:00:00Z')), endedAt: Timestamp.fromDate(new Date('2024-01-03T00:00:00Z')), isEnded: true })).toEqual({ id: 'legacy', start: '2024-01-02', end: '2024-01-03', comment: '' }))
  it('rejects malformed documents', () => expect(() => normalizeRecord('bad', { isEnded: false })).toThrow('Malformed period document'))
})
