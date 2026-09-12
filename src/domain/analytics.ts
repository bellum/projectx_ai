import { daysBetween } from './dateUtils'
import { sortPeriods } from './periodRules'
import type { Period, PeriodAnalytics } from '../types/period'

export function buildPeriodAnalytics(periods: Period[]): PeriodAnalytics {
  const sorted = sortPeriods(periods)
  return {
    periodCount: sorted.length,
    latest: sorted.at(-1) ? { id: sorted.at(-1)!.id, start: sorted.at(-1)!.start, end: sorted.at(-1)!.end } : undefined,
    gaps: sorted.slice(1).map((period, index) => ({ periodId: period.id, start: period.start, end: period.end, gapDays: daysBetween(sorted[index].end, period.start) })),
  }
}
