import { addDays, compareDays, daysBetween } from './dateUtils'
import type { PeriodAnalytics, Prediction } from '../types/period'

function unavailable(message: string, sampleCount = 0): Prediction { return { sampleCount, unavailable: message } }
export function calculatePredictions(analytics: PeriodAnalytics | undefined, today: import('../types/period').IsoDate): { latestGap: Prediction; average: Prediction } {
  if (!analytics) return { latestGap: unavailable('History is being prepared.'), average: unavailable('History is being prepared.') }
  const latest = analytics.latest
  if (!latest || daysBetween(latest.start, today) <= 14) return { latestGap: unavailable('Available when the latest period started more than 14 days ago.'), average: unavailable('Available when the latest period started more than 14 days ago.') }
  const latestSample = analytics.gaps.find(sample => sample.periodId === latest.id)
  const latestGap = latestSample ? { date: addDays(latest.end, latestSample.gapDays), gapDays: latestSample.gapDays, sampleCount: 1, unavailable: '' } : unavailable('Need one earlier period.')
  const cutoff = addDays(latest.start, -365)
  const gaps = analytics.gaps.filter(item => compareDays(item.start, cutoff) >= 0 && compareDays(item.start, latest.start) <= 0)
  const average = gaps.length ? Math.round(gaps.reduce((total, item) => total + item.gapDays, 0) / gaps.length) : undefined
  return { latestGap, average: average === undefined ? unavailable('Need a qualifying gap.', gaps.length) : { date: addDays(latest.end, average), gapDays: average, sampleCount: gaps.length, unavailable: '' } }
}
