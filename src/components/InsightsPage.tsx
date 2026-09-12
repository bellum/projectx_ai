import { useEffect, useRef, useState } from 'react'
import { addMonths, compareDays, endOfMonth, monthLabel, parseIsoDay, startOfMonth, todayIsoDay } from '../domain/dateUtils'
import { useAuth } from '../auth/useAuth'
import { usePeriodAnalytics } from '../data/usePeriodAnalytics'
import type { GapSample, IsoDate } from '../types/period'

function useMobileChart() {
  const query = '(max-width: 767px)'
  const [mobile, setMobile] = useState(() => typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches))
  useEffect(() => { if (typeof window === 'undefined' || !window.matchMedia) return; const media = window.matchMedia(query), update = () => setMobile(media.matches); update(); media.addEventListener('change', update); return () => media.removeEventListener('change', update) }, [])
  return mobile
}
function shortMonth(day: IsoDate) { return new Intl.DateTimeFormat('en', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(parseIsoDay(day)) }
function ChartStats({ samples }: { samples: GapSample[] }) {
  if (!samples.length) return null
  const gaps = samples.map(sample => sample.gapDays), average = Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length)
  return <div className="gap-stats" aria-label="Gap statistics"><div><span>Typical gap</span><strong>{average} days</strong></div><div><span>Shortest</span><strong>{Math.min(...gaps)} days</strong></div><div><span>Longest</span><strong>{Math.max(...gaps)} days</strong></div></div>
}
function GapChart({ samples }: { samples: GapSample[] }) {
  if (!samples.length) return <div className="empty-chart"><strong>No recorded gaps</strong><span>Choose an earlier range to view more history.</span></div>
  const width = 720, height = 270, left = 44, right = 18, top = 20, bottom = 38
  const values = samples.map(sample => sample.gapDays), floor = Math.max(0, Math.floor(Math.min(...values) / 5) * 5 - 5), ceiling = Math.ceil(Math.max(...values) / 5) * 5 + 5, range = Math.max(ceiling - floor, 1)
  const coordinate = (sample: GapSample, index: number) => ({ x: left + (index * (width - left - right)) / Math.max(samples.length - 1, 1), y: top + ((ceiling - sample.gapDays) * (height - top - bottom)) / range })
  const points = samples.map(coordinate), line = points.map(point => `${point.x},${point.y}`).join(' '), area = `${left},${height - bottom} ${line} ${points.at(-1)!.x},${height - bottom}`
  const labels = [...new Set([0, Math.floor((samples.length - 1) / 2), samples.length - 1])]
  const guides = [floor, Math.round((floor + ceiling) / 2), ceiling]
  return <><div className="chart-canvas"><svg className="gap-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Gap line chart with ${samples.length} samples, from ${shortMonth(samples[0].start)} to ${shortMonth(samples.at(-1)!.start)}`}><defs><linearGradient id="gap-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a01942" stopOpacity=".24"/><stop offset="100%" stopColor="#a01942" stopOpacity="0"/></linearGradient></defs>{guides.map(value => { const y = top + ((ceiling - value) * (height - top - bottom)) / range; return <g key={value}><line className="chart-guide" x1={left} x2={width - right} y1={y} y2={y}/><text className="chart-y-label" x={left - 8} y={y + 4}>{value}</text></g> })}<polygon points={area} fill="url(#gap-area)"/><polyline points={line} fill="none" stroke="#8c2450" strokeWidth="3.5" strokeLinejoin="round" strokeLinecap="round"/>{points.map((point, index) => <circle key={samples[index].periodId} cx={point.x} cy={point.y} r="4.5"><title>{shortMonth(samples[index].start)}: {samples[index].gapDays} days</title></circle>)}{labels.map(index => <text className="chart-x-label" key={index} x={points[index].x} y={height - 12} textAnchor={index === 0 ? 'start' : index === samples.length - 1 ? 'end' : 'middle'}>{shortMonth(samples[index].start)}</text>)}</svg></div><details className="chart-details"><summary>View gap data</summary><table><thead><tr><th scope="col">Period</th><th scope="col">Gap</th></tr></thead><tbody>{samples.map(sample => <tr key={sample.periodId}><td>{shortMonth(sample.start)}</td><td>{sample.gapDays} days</td></tr>)}</tbody></table></details></>
}
export function InsightsPage({ onCalendar }: { onCalendar(): void }) {
  const { user, signOut } = useAuth(), { value: analytics, loading, error } = usePeriodAnalytics(), mobile = useMobileChart(), months = mobile ? 12 : 24
  const latestMonth = startOfMonth(analytics?.latest?.start ?? todayIsoDay()), [anchor, setAnchor] = useState<IsoDate>(latestMonth), initialized = useRef(false)
  useEffect(() => { if (analytics?.latest && !initialized.current) { initialized.current = true; setAnchor(startOfMonth(analytics.latest.start)) } }, [analytics])
  const start = addMonths(anchor, -(months - 1)), end = endOfMonth(anchor), gaps = analytics?.gaps.filter(sample => compareDays(sample.start, start) >= 0 && compareDays(sample.start, end) <= 0) ?? []
  const earliest = analytics?.gaps[0] ? startOfMonth(analytics.gaps[0].start) : latestMonth, canBack = compareDays(anchor, earliest) > 0, canForward = compareDays(anchor, latestMonth) < 0
  const move = (direction: -1 | 1) => { const next = addMonths(anchor, direction * months); setAnchor(direction < 0 && compareDays(next, earliest) < 0 ? earliest : direction > 0 && compareDays(next, latestMonth) > 0 ? latestMonth : next) }
  return <main className="page"><header><div><p className="eyebrow">Shared calendar</p><h1>Gap insights</h1></div><div className="header-actions"><button type="button" className="secondary-action" onClick={onCalendar}>Calendar</button><button type="button" onClick={() => void signOut()} aria-label="Sign out">Sign out</button></div></header><p className="signed-in">Signed in as {user?.email ?? 'Google account'}</p>{error ? <p role="alert">Unable to load insights: {error}</p> : loading ? <p>Loading insights…</p> : !analytics ? <p className="hint">Gap history has not been initialized yet. Run the documented analytics migration once.</p> : <section className="insights"><div className="insights-heading"><div><p className="eyebrow">Cycle history</p><h2>Days between periods</h2></div><span className="range-pill">{mobile ? '12' : '24'} months</span></div><div className="chart-nav"><button type="button" className="icon-action" aria-label="Show older gap history" onClick={() => move(-1)} disabled={!canBack}>←</button><span>{monthLabel(start)} – {monthLabel(anchor)}</span><button type="button" className="icon-action" aria-label="Show newer gap history" onClick={() => move(1)} disabled={!canForward}>→</button></div><ChartStats samples={gaps}/><GapChart samples={gaps}/></section>}</main>
}
