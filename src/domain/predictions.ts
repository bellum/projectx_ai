import { addDays, compareDays, daysBetween } from './dateUtils'
import type { PeriodAnalytics, Prediction } from '../types/period'

function unavailable(message: string, sampleCount = 0): Prediction { return { sampleCount, unavailable: message } }
export function calculatePredictions(analytics: PeriodAnalytics | undefined, today: import('../types/period').IsoDate): { latestInterval: Prediction; average: Prediction } {
  if (!analytics) return { latestInterval: unavailable('History is being prepared.'), average: unavailable('History is being prepared.') }
  const latest = analytics.latest
  if (!latest || daysBetween(latest.start, today) <= 14) return { latestInterval: unavailable('Available when the latest period started more than 14 days ago.'), average: unavailable('Available when the latest period started more than 14 days ago.') }
  const latestSample = analytics.intervals.find(sample => sample.periodId === latest.id)
  const latestInterval = latestSample ? { date: addDays(latest.end, latestSample.intervalDays), intervalDays: latestSample.intervalDays, sampleCount: 1, unavailable: '' } : unavailable('Need one earlier period.')
  const cutoff = addDays(latest.start, -365)
  const intervals = analytics.intervals.filter(item => compareDays(item.start, cutoff) >= 0 && compareDays(item.start, latest.start) <= 0)
  const average = intervals.length ? Math.round(intervals.reduce((total, item) => total + item.intervalDays, 0) / intervals.length) : undefined
  return { latestInterval, average: average === undefined ? unavailable('Need a qualifying interval.', intervals.length) : { date: addDays(latest.end, average), intervalDays: average, sampleCount: intervals.length, unavailable: '' } }
}
