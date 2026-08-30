import { addMonths, monthLabel, parseIsoDay, startOfMonth } from '../domain/dateUtils'
import type { IsoDate, Period } from '../types/period'
import { MonthGrid } from './MonthGrid'

interface Props { periods: Period[]; anchor: IsoDate; today: IsoDate; predicted: IsoDate[]; preview?: { start: IsoDate; end: IsoDate }; onAnchor(anchor: IsoDate): void; onSelect(day: IsoDate): void; onRange(start: IsoDate, end: IsoDate): void; onRangePreview(preview?: { start: IsoDate; end: IsoDate }): void }
function rangeLabel(first: IsoDate, second: IsoDate): string { const firstDate = parseIsoDay(first), secondDate = parseIsoDay(second); if (firstDate.getUTCFullYear() === secondDate.getUTCFullYear()) return `${new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(firstDate)} – ${monthLabel(second)}`; return `${monthLabel(first)} – ${monthLabel(second)}` }
export function TwoMonthCalendar({ periods, anchor, today, predicted, preview, onAnchor, onSelect, onRange, onRangePreview }: Props) {
  const current = startOfMonth(today), next = addMonths(anchor, 1), canForward = anchor < current
  return <section className="calendar"><div className="calendar-nav"><button type="button" aria-label="Show older months" onClick={() => onAnchor(addMonths(anchor, -1))}>←</button><span>{rangeLabel(anchor, next)}</span><button type="button" aria-label="Show newer months" disabled={!canForward} onClick={() => onAnchor(addMonths(anchor, 1))}>→</button></div><div className="months"><MonthGrid month={anchor} periods={periods} today={today} predicted={predicted} preview={preview} onSelect={onSelect} onRange={onRange} onRangePreview={onRangePreview}/><MonthGrid month={next} periods={periods} today={today} predicted={predicted} preview={preview} onSelect={onSelect} onRange={onRange} onRangePreview={onRangePreview}/></div></section>
}
