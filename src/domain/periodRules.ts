import { addDays, compareDays, isFuture } from './dateUtils'
import type { IsoDate, Period, PeriodDraft } from '../types/period'

export function sortPeriods(periods: Period[]): Period[] { return [...periods].sort((a, b) => compareDays(a.start, b.start) || compareDays(a.end, b.end) || a.id.localeCompare(b.id)) }
export function normalizeRange(a: IsoDate, b: IsoDate): Pick<PeriodDraft, 'start' | 'end'> { return compareDays(a, b) <= 0 ? { start: a, end: b } : { start: b, end: a } }
export function rangeIsValid(start: IsoDate, end: IsoDate, today?: IsoDate): string | undefined {
  if (compareDays(start, end) > 0) return 'Start date must be before the end date.'
  if (today && (isFuture(start, today) || isFuture(end, today))) return 'Future dates cannot be saved.'
  return undefined
}
export function touchedPeriods(periods: Period[], start: IsoDate, end: IsoDate): Period[] {
  return sortPeriods(periods.filter(period => compareDays(period.start, addDays(end, 1)) <= 0 && compareDays(period.end, addDays(start, -1)) >= 0))
}
export function combinedComment(periods: Period[]): string { return sortPeriods(periods).map(p => p.comment.trim()).filter(Boolean).join('\n\n') }
export function createDraft(periods: Period[], start: IsoDate, end: IsoDate, existing?: Period): PeriodDraft {
  const range = normalizeRange(start, end)
  const touched = existing ? [existing] : touchedPeriods(periods, range.start, range.end)
  const bounds = touched.reduce((result, item) => ({ start: compareDays(item.start, result.start) < 0 ? item.start : result.start, end: compareDays(item.end, result.end) > 0 ? item.end : result.end }), range)
  return { id: existing?.id, ...bounds, comment: existing?.comment ?? combinedComment(touched), touchedIds: touched.map(p => p.id), merged: !existing && touched.length > 0 }
}
