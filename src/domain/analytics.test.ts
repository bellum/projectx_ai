import { buildPeriodAnalytics } from './analytics'
import type { Period } from '../types/period'

describe('period analytics', () => {
  it('stores each adjacent interval with the later period and latest period details', () => {
    const periods: Period[] = [{ id: 'later', start: '2024-03-10', end: '2024-03-14', comment: '' }, { id: 'first', start: '2024-01-01', end: '2024-01-05', comment: '' }, { id: 'middle', start: '2024-02-01', end: '2024-02-03', comment: '' }]
    expect(buildPeriodAnalytics(periods)).toEqual({ periodCount: 3, latest: { id: 'later', start: '2024-03-10', end: '2024-03-14' }, intervals: [{ periodId: 'middle', previousStart: '2024-01-01', start: '2024-02-01', end: '2024-02-03', intervalDays: 27 }, { periodId: 'later', previousStart: '2024-02-01', start: '2024-03-10', end: '2024-03-14', intervalDays: 36 }] })
  })
})
