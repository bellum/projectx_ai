import { addDays } from './dateUtils'
import { shouldShowCurrentAndNextOnMobile } from './calendarDisplay'
import type { Period } from '../types/period'

describe('calendar display', () => {
  const today = '2026-09-12' as const
  it('shows the current and next pair on mobile when the latest period ended within seven days', () => {
    const periods: Period[] = [{ id: 'recent', start: addDays(today, -9), end: addDays(today, -7), comment: '' }]
    expect(shouldShowCurrentAndNextOnMobile(periods, today, true)).toBe(true)
  })
  it('keeps the usual pair for desktop, no records, future records, and periods older than seven days', () => {
    const period: Period = { id: 'older', start: addDays(today, -10), end: addDays(today, -8), comment: '' }
    expect(shouldShowCurrentAndNextOnMobile([period], today, false)).toBe(false)
    expect(shouldShowCurrentAndNextOnMobile([], today, true)).toBe(false)
    expect(shouldShowCurrentAndNextOnMobile([{ ...period, end: addDays(today, 1) }], today, true)).toBe(false)
    expect(shouldShowCurrentAndNextOnMobile([period], today, true)).toBe(false)
  })
})
