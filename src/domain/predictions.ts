import { addDays, compareDays, daysBetween } from './dateUtils'
import { sortPeriods } from './periodRules'
import type { Prediction, Period } from '../types/period'

function unavailable(message: string, sampleCount = 0): Prediction { return { sampleCount, unavailable: message } }
export function calculatePredictions(periods: Period[], today: import('../types/period').IsoDate): { latestGap: Prediction; average: Prediction } {
  const sorted = sortPeriods(periods)
  const latest = sorted.at(-1)
  if (!latest || daysBetween(latest.start, today) <= 14) return { latestGap: unavailable('Available when the latest period started more than 14 days ago.'), average: unavailable('Available when the latest period started more than 14 days ago.') }
  const previous = sorted.at(-2)
  const latestGap = previous ? { date: addDays(latest.end, daysBetween(previous.end, latest.start)), gapDays: daysBetween(previous.end, latest.start), sampleCount: 1, unavailable: '' } : unavailable('Need one earlier period.')
  const cutoff = addDays(latest.start, -365)
  const gaps = sorted.slice(1).map((period, index) => ({ start: period.start, gap: daysBetween(sorted[index].end, period.start) })).filter(item => compareDays(item.start, cutoff) >= 0 && compareDays(item.start, latest.start) <= 0)
  const average = gaps.length ? Math.round(gaps.reduce((total, item) => total + item.gap, 0) / gaps.length) : undefined
  return { latestGap, average: average === undefined ? unavailable('Need a qualifying gap.', gaps.length) : { date: addDays(latest.end, average), gapDays: average, sampleCount: gaps.length, unavailable: '' } }
}
