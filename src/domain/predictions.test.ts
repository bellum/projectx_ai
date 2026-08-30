import { calculatePredictions } from './predictions'
import type { Period } from '../types/period'
const periods: Period[] = [{ id: '1', start: '2024-01-01', end: '2024-01-05', comment: '' }, { id: '2', start: '2024-01-30', end: '2024-02-03', comment: '' }, { id: '3', start: '2024-02-28', end: '2024-03-02', comment: '' }]
describe('predictions', () => {
  it('requires latest start to be more than 14 days ago', () => { expect(calculatePredictions(periods, '2024-03-13').latestGap.date).toBeUndefined(); expect(calculatePredictions(periods, '2024-03-14').latestGap.date).toBe('2024-03-27') })
  it('provides average and latest-gap predictions', () => { const value = calculatePredictions(periods, '2024-04-01'); expect(value.latestGap).toMatchObject({ date: '2024-03-27', gapDays: 25 }); expect(value.average).toMatchObject({ date: '2024-03-27', gapDays: 25, sampleCount: 2 }) })
})
