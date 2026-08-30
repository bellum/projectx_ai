import { addMonths, monthLabel, startOfMonth } from '../domain/dateUtils'
import type { IsoDate, Period } from '../types/period'
import { MonthGrid } from './MonthGrid'

interface Props { periods: Period[]; anchor: IsoDate; selectedStart?: IsoDate; today: IsoDate; predicted: IsoDate[]; onAnchor(anchor: IsoDate): void; onSelect(day: IsoDate): void }
export function TwoMonthCalendar({ periods, anchor, selectedStart, today, predicted, onAnchor, onSelect }: Props) {
  const current = startOfMonth(today), next = addMonths(anchor, 1), canForward = anchor < current
  return <section className="calendar"><div className="calendar-nav"><button type="button" aria-label="Show older months" onClick={() => onAnchor(addMonths(anchor, -1))}>←</button><span>{monthLabel(anchor)} – {monthLabel(next)}</span><button type="button" aria-label="Show newer months" disabled={!canForward} onClick={() => onAnchor(addMonths(anchor, 1))}>→</button></div><div className="months"><MonthGrid month={anchor} periods={periods} selectedStart={selectedStart} today={today} predicted={predicted} onSelect={onSelect}/><MonthGrid month={next} periods={periods} selectedStart={selectedStart} today={today} predicted={predicted} onSelect={onSelect}/></div></section>
}
