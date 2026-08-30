import { Timestamp } from 'firebase/firestore'
import { addDays, isoDayToTimestamp, timestampToIsoDay } from './dateUtils'

describe('date utilities', () => {
  it.each(['00:00:00Z', '21:00:00Z', '22:00:00Z', '23:00:00Z'])('normalizes %s by nearest UTC midnight', time => {
    const expected = time.startsWith('00') ? '2024-02-29' : '2024-03-01'
    expect(timestampToIsoDay(Timestamp.fromDate(new Date(`2024-02-29T${time}`)))).toBe(expected)
  })
  it('writes canonical UTC midnight and handles calendar boundaries', () => {
    expect(isoDayToTimestamp('2024-02-29').toDate().toISOString()).toBe('2024-02-29T00:00:00.000Z')
    expect(addDays('2024-12-31', 1)).toBe('2025-01-01')
    expect(addDays('2024-03-10', 1)).toBe('2024-03-11')
  })
})
