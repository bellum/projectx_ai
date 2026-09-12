import { useEffect, useRef, useState } from 'react'
import { addMonths, compareDays, endOfMonth, monthLabel, parseIsoDay, startOfMonth, todayIsoDay } from '../domain/dateUtils'
import { useAuth } from '../auth/useAuth'
import { usePeriodAnalytics } from '../data/usePeriodAnalytics'
import type { IntervalSample, IsoDate } from '../types/period'

function useMobileChart() {
  const query = '(max-width: 767px)'
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches))
  useEffect(() => { if (typeof window === 'undefined' || !window.matchMedia) return; const media = window.matchMedia(query), update = () => setMobile(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  return mobile
}
function shortMonth(day: IsoDate) { return new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(parseIsoDay(day)) }
function periodMonth(day: IsoDate) { return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(day)) }
function intervalDescription(sample: IntervalSample) {
  const previous = periodMonth(sample.previousStart ?? sample.start), current = periodMonth(sample.start)
  return `${previous === current ? current : `${previous} – ${current}`}: ${sample.intervalDays} days`
}
function ChartStats({ samples }: { samples: IntervalSample[] }) {
  if (!samples.length) return null
  const intervals = samples.map(sample => sample.intervalDays), average = Math.round(intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length)
  return <div className="interval-stats" aria-label="Interval statistics"><div><span>Typical interval</span><strong>{average} days</strong></div><div><span>Shortest</span><strong>{Math.min(...intervals)} days</strong></div><div><span>Longest</span><strong>{Math.max(...intervals)} days</strong></div></div>
}
function IntervalChart({ samples }: { samples: IntervalSample[] }) {
  const [activeIndex, setActiveIndex] = useState<number>()
  if (!samples.length) return <div className="empty-chart"><strong>No recorded intervals</strong><span>Choose an earlier range to view more history.</span></div>
  const width = 720, height = 270, left = 44, right = 18, top = 20, bottom = 38
  const values = samples.map(sample => sample.intervalDays), floor = Math.max(0, Math.floor(Math.min(...values) / 5) * 5 - 5), ceiling = Math.ceil(Math.max(...values) / 5) * 5 + 5, range = Math.max(ceiling - floor, 1)
  const coordinate = (sample: IntervalSample, index: number) => ({ x: left + (index * (width - left - right)) / Math.max(samples.length - 1, 1), y: top + ((ceiling - sample.intervalDays) * (height - top - bottom)) / range })
  const points = samples.map(coordinate), line = points.map(point => `${point.x},${point.y}`).join(' '), area = `${left},${height - bottom} ${line} ${points.at(-1)!.x},${height - bottom}`
  const labels = [...new Set([0, Math.floor((samples.length - 1) / 2), samples.length - 1])], guides = [floor, Math.round((floor + ceiling) / 2), ceiling]
  const selectPoint = (clientX: number, target: SVGSVGElement) => {
    const bounds = target.getBoundingClientRect(), chartX = bounds.width ? ((clientX - bounds.left) / bounds.width) * width : left
    setActiveIndex(points.reduce((nearest, point, index) => Math.abs(point.x - chartX) < Math.abs(points[nearest].x - chartX) ? index : nearest, 0))
  }
  const active = activeIndex === undefined ? undefined : { point: points[activeIndex], sample: samples[activeIndex] }
  return <><div className="chart-canvas"><svg className="interval-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Interval line chart with ${samples.length} samples, from ${shortMonth(samples[0].start)} to ${shortMonth(samples.at(-1)!.start)}`} onPointerMove={event => { if (event.pointerType !== 'touch') selectPoint(event.clientX, event.currentTarget) }} onPointerDown={event => { if (event.pointerType === 'touch') selectPoint(event.clientX, event.currentTarget) }} onPointerLeave={event => { if (event.pointerType !== 'touch') setActiveIndex(undefined) }}><defs><linearGradient id="interval-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a01942" stopOpacity=".24"/><stop offset="100%" stopColor="#a01942" stopOpacity="0"/></linearGradient></defs>{guides.map(value => { const y = top + ((ceiling - value) * (height - top - bottom)) / range; return <g key={value}><line className="chart-guide" x1={left} x2={width - right} y1={y} y2={y}/><text className="chart-y-label" x={left - 8} y={y + 4}>{value}</text></g> })}<polygon points={area} fill="url(#interval-area)"/><polyline points={line} fill="none" stroke="#8c2450" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>{active && <><line data-testid="interval-cursor" className="chart-cursor" x1={active.point.x} x2={active.point.x} y1={top} y2={height - bottom}/><circle className="active-point" cx={active.point.x} cy={active.point.y} r="7"/></>}{points.map((point, index) => <circle key={samples[index].periodId} cx={point.x} cy={point.y} r="4.5"><title>{intervalDescription(samples[index])}</title></circle>)}{labels.map(index => <text className="chart-x-label" key={index} x={points[index].x} y={height - 12} textAnchor={index === 0 ? 'start' : index === samples.length - 1 ? 'end' : 'middle'}>{shortMonth(samples[index].start)}</text>)}</svg>{active && <p className="chart-tooltip" role="status">{intervalDescription(active.sample)}</p>}</div><details className="chart-details"><summary>View interval data</summary><table><thead><tr><th scope="col">Period</th><th scope="col">Interval</th></tr></thead><tbody>{samples.map(sample => <tr key={sample.periodId}><td>{shortMonth(sample.start)}</td><td>{sample.intervalDays} days</td></tr>)}</tbody></table></details></>
}
export function InsightsPage({ onCalendar }: { onCalendar(): void }) {
  const { user, signOut } = useAuth(), { value: analytics, loading, error } = usePeriodAnalytics(), mobile = useMobileChart(), months = mobile ? 12 : 24
  const latestMonth = startOfMonth(analytics?.latest?.start ?? todayIsoDay()), [anchor, setAnchor] = useState<IsoDate>(latestMonth), initialized = useRef(false)
  useEffect(() => { if (analytics?.latest && !initialized.current) { initialized.current = true; setAnchor(startOfMonth(analytics.latest.start)) } }, [analytics])
  const allIntervals = analytics?.intervals.map((sample, index) => ({ ...sample, previousStart: sample.previousStart ?? analytics.intervals[index - 1]?.start })) ?? []
  const start = addMonths(anchor, -(months - 1)), end = endOfMonth(anchor), intervals = allIntervals.filter(sample => compareDays(sample.start, start) >= 0 && compareDays(sample.start, end) <= 0)
  const earliest = allIntervals[0] ? startOfMonth(allIntervals[0].start) : latestMonth, canBack = compareDays(anchor, earliest) > 0, canForward = compareDays(anchor, latestMonth) < 0
  const move = (direction: -1 | 1) => { const next = addMonths(anchor, direction * months); setAnchor(direction < 0 && compareDays(next, earliest) < 0 ? earliest : direction > 0 && compareDays(next, latestMonth) > 0 ? latestMonth : next) }
  return <main className="page"><header><div><p className="eyebrow">Shared calendar</p><h1>Cycle insights</h1></div><div className="header-actions"><button type="button" className="secondary-action" onClick={onCalendar}>Calendar</button><button type="button" onClick={() => void signOut()} aria-label="Sign out">Sign out</button></div></header><p className="signed-in">Signed in as {user?.email ?? 'Google account'}</p>{error ? <p role="alert">Unable to load insights: {error}</p> : loading ? <p>Loading insights…</p> : !analytics ? <p className="hint">Interval history has not been initialized yet. Run the documented analytics migration once.</p> : <section className="insights"><div className="insights-heading"><div><p className="eyebrow">Cycle history</p><h2>Days between periods</h2></div><span className="range-pill">{mobile ? '12' : '24'} months</span></div><div className="chart-nav"><button type="button" className="icon-action" aria-label="Show older interval history" onClick={() => move(-1)} disabled={!canBack}>←</button><span>{monthLabel(start)} – {monthLabel(anchor)}</span><button type="button" className="icon-action" aria-label="Show newer interval history" onClick={() => move(1)} disabled={!canForward}>→</button></div><ChartStats samples={intervals}/><IntervalChart samples={intervals}/></section>}</main>
}
