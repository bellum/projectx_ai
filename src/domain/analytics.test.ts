import { buildPeriodAnalytics } from './analytics'
import type { Period } from '../types/period'

describe('period analytics', () => {
  it('stores each adjacent interval with the later period and latest period details', () => {
    const periods: Period[] = [{ id: 'later', start: '2024-03-10', end: '2024-03-14', comment: '' }, { id: 'first', start: '2024-01-01', end: '2024-01-05', comment: '' }, { id: 'middle', start: '2024-02-01', end: '2024-02-03', comment: '' }]
    expect(buildPeriodAnalytics(periods)).toEqual({ periodCount: 3, latest: { id: 'later', start: '2024-03-10', end: '2024-03-14' }, intervals: [{ periodId: 'middle', previousStart: '2024-01-01', start: '2024-02-01', end: '2024-02-03', intervalDays: 26 }, { periodId: 'later', previousStart: '2024-02-01', start: '2024-03-10', end: '2024-03-14', intervalDays: 35 }] })
  })
  it('counts only whole days strictly between adjacent periods', () => {
    const periods: Period[] = [{ id: 'previous', start: '2026-09-12', end: '2026-09-16', comment: '' }, { id: 'current', start: '2026-10-15', end: '2026-10-18', comment: '' }]
    expect(buildPeriodAnalytics(periods).intervals[0].intervalDays).toBe(28)
  })
})
