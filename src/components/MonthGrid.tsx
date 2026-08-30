import { addDays, daysInMonth, formatIsoDay, isFuture, parseIsoDay, startOfMonth, weekdayOffset } from '../domain/dateUtils'
import type { IsoDate, Period } from '../types/period'

interface Props { month: IsoDate; periods: Period[]; selectedStart?: IsoDate; today: IsoDate; predicted: IsoDate[]; onSelect(day: IsoDate): void }
export function MonthGrid({ month, periods, selectedStart, today, predicted, onSelect }: Props) {
  const first = startOfMonth(month), days = daysInMonth(first), offset = weekdayOffset(first)
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return <section className="month" aria-label={new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(first))}><h2>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(first))}</h2><div className="weekdays">{labels.map(label => <span key={label}>{label}</span>)}</div><div className="days">{Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}{Array.from({ length: days }, (_, index) => { const day = addDays(first, index); const period = periods.find(item => day >= item.start && day <= item.end); const future = isFuture(day, today); const selected = selectedStart === day; const prediction = predicted.includes(day); return <button key={day} type="button" disabled={future} aria-label={`${formatIsoDay(parseIsoDay(day))}${period ? ', recorded period' : ''}${future ? ', future date' : ''}`} aria-pressed={selected} className={[period && 'marked', selected && 'selected', prediction && 'predicted', day === today && 'today'].filter(Boolean).join(' ')} onClick={() => onSelect(day)}>{index + 1}</button> })}</div></section>
}
