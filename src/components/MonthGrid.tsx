import { useEffect, useRef } from 'react'
import { addDays, compareDays, daysInMonth, formatIsoDay, isFuture, parseIsoDay, startOfMonth, weekdayOffset } from '../domain/dateUtils'
import type { IsoDate, Period } from '../types/period'

interface Props { month: IsoDate; periods: Period[]; today: IsoDate; predicted: IsoDate[]; preview?: { start: IsoDate; end: IsoDate }; onSelect(day: IsoDate): void; onRange(start: IsoDate, end: IsoDate): void; onRangePreview(preview?: { start: IsoDate; end: IsoDate }): void }
interface Drag { start: IsoDate; end: IsoDate; moved: boolean; touch: boolean }

const longPressDelay = 350

export function MonthGrid({ month, periods, today, predicted, preview, onSelect, onRange, onRangePreview }: Props) {
  const first = startOfMonth(month), days = daysInMonth(first), offset = weekdayOffset(first)
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const grid = useRef<HTMLDivElement>(null), drag = useRef<Drag | undefined>(undefined), holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), suppressClick = useRef(false)
  const clearHold = () => { if (holdTimer.current) { clearTimeout(holdTimer.current); holdTimer.current = undefined } }
  const dayAt = (clientX: number, clientY: number): IsoDate | undefined => {
    const button = typeof document.elementFromPoint === 'function' ? document.elementFromPoint(clientX, clientY)?.closest<HTMLButtonElement>('button[data-day]') : undefined
    return button && !button.disabled ? button.dataset.day as IsoDate : undefined
  }
  const updateDrag = (clientX: number, clientY: number) => {
    const value = drag.current, day = dayAt(clientX, clientY)
    if (value && day && day !== value.end) { value.end = day; value.moved = true; onRangePreview({ start: value.start, end: day }) }
  }
  const finishDrag = () => {
    clearHold()
    const value = drag.current
    drag.current = undefined
    onRangePreview(undefined)
    if (value?.moved) { suppressClick.current = true; onRange(value.start, value.end) }
  }
  const cancelDrag = () => { clearHold(); drag.current = undefined; onRangePreview(undefined) }

  useEffect(() => {
    const element = grid.current
    if (!element) return
    const handleTouchMove = (event: TouchEvent) => {
      if (!drag.current?.touch) return
      const touch = event.touches[0]
      if (!touch) return
      event.preventDefault()
      updateDrag(touch.clientX, touch.clientY)
    }
    element.addEventListener('touchmove', handleTouchMove, { passive: false })
    return () => element.removeEventListener('touchmove', handleTouchMove)
  })

  return <section className="month" aria-label={new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(first))}>
    <h2>{new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(first))}</h2>
    <div className="weekdays">{labels.map(label => <span key={label}>{label}</span>)}</div>
    <div ref={grid} className="days" onPointerMove={event => {
      if (!drag.current) { if (event.pointerType === 'touch') clearHold(); return }
      if (drag.current.touch) { event.preventDefault(); updateDrag(event.clientX, event.clientY); return }
      event.preventDefault()
      updateDrag(event.clientX, event.clientY)
    }} onPointerUp={finishDrag} onPointerCancel={cancelDrag}>
      {Array.from({ length: offset }, (_, index) => <span key={`blank-${index}`} />)}
      {Array.from({ length: days }, (_, index) => {
        const day = addDays(first, index), period = periods.find(item => day >= item.start && day <= item.end), future = isFuture(day, today), prediction = predicted.includes(day)
        const selected = preview && compareDays(day, preview.start < preview.end ? preview.start : preview.end) >= 0 && compareDays(day, preview.start < preview.end ? preview.end : preview.start) <= 0
        return <button key={day} data-day={day} type="button" disabled={future} aria-label={`${formatIsoDay(parseIsoDay(day))}${period ? ', recorded period' : ''}${future ? ', future date' : ''}`} className={[period && 'marked', selected && 'selected', prediction && 'predicted', day === today && 'today'].filter(Boolean).join(' ')} onPointerDown={event => {
          if (event.pointerType === 'mouse') {
            if (event.button !== 0) return
            event.preventDefault()
            drag.current = { start: day, end: day, moved: false, touch: false }
            onRangePreview({ start: day, end: day })
            event.currentTarget.setPointerCapture?.(event.pointerId)
            return
          }
          if (event.pointerType !== 'touch') return
          clearHold()
          holdTimer.current = setTimeout(() => {
            drag.current = { start: day, end: day, moved: false, touch: true }
            onRangePreview({ start: day, end: day })
          }, longPressDelay)
        }} onClick={() => { if (suppressClick.current) { suppressClick.current = false; return } onSelect(day) }}>{index + 1}</button>
      })}
    </div>
  </section>
}
