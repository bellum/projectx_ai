import { useState } from 'react'
import { addMonths, endOfMonth, isInLastWeekOfMonth, startOfMonth, todayIsoDay } from '../domain/dateUtils'
import { createDraft } from '../domain/periodRules'
import { calculatePredictions } from '../domain/predictions'
import { removePeriod, savePeriod } from '../data/periodRepository'
import { usePeriods } from '../data/usePeriods'
import { usePeriodAnalytics } from '../data/usePeriodAnalytics'
import { useAuth } from '../auth/useAuth'
import type { IsoDate, PeriodDraft } from '../types/period'
import { TwoMonthCalendar } from './TwoMonthCalendar'
import { PeriodEditor } from './PeriodEditor'
import { PredictionSummary } from './PredictionSummary'

export function CalendarPage({ onInsights }: { onInsights(): void }) {
  const { user, signOut } = useAuth(); const today = todayIsoDay(), currentMonth = startOfMonth(today)
  const [anchor, setAnchor] = useState<IsoDate>(() => isInLastWeekOfMonth(today) ? currentMonth : addMonths(currentMonth, -1))
  const loadFrom = anchor === currentMonth ? addMonths(currentMonth, -2) : addMonths(anchor, -1), loadTo = endOfMonth(addMonths(anchor, 1))
  const { periods, loading, error: loadError } = usePeriods(loadFrom, loadTo)
  const { value: analytics } = usePeriodAnalytics()
  const [draft, setDraft] = useState<PeriodDraft>(), [preview, setPreview] = useState<{ start: IsoDate; end: IsoDate }>(), [pending, setPending] = useState(false), [mutationError, setMutationError] = useState<string>()
  const predictions = calculatePredictions(analytics, today)
  const select = (day: IsoDate) => { const existing = periods.find(item => day >= item.start && day <= item.end); if (existing) { setDraft(createDraft(periods, existing.start, existing.end, existing)); return } setDraft(createDraft(periods, day, day)) }
  const execute = async (operation: () => Promise<void>) => { setPending(true); setMutationError(undefined); try { await operation(); setDraft(undefined) } catch (reason) { setMutationError((reason as Error).message || 'Unable to save. Please try again.') } finally { setPending(false) } }
  return <main className="page"><header><div><p className="eyebrow">Shared calendar</p><h1>Periods</h1></div><div className="header-actions"><button type="button" className="secondary-action" onClick={onInsights}>Insights</button><button type="button" onClick={() => void signOut()} aria-label="Sign out">Sign out</button></div></header><p className="signed-in">Signed in as {user?.email ?? 'Google account'}</p>{loadError ? <p role="alert">Unable to load periods: {loadError}</p> : loading ? <p>Loading periods…</p> : <><p className="instruction">Tap an unmarked day to add a one-day period, or drag across dates to add a range. Tap a recorded period to edit it.</p><TwoMonthCalendar periods={periods} anchor={anchor} today={today} predicted={[predictions.latestInterval.date, predictions.average.date].filter((value): value is IsoDate => Boolean(value))} preview={preview} onAnchor={setAnchor} onSelect={select} onRange={(start, end) => setDraft(createDraft(periods, start, end))} onRangePreview={setPreview}/><PredictionSummary {...predictions}/></>}{draft && <PeriodEditor draft={draft} today={today} pending={pending} error={mutationError} onSave={value => void execute(() => savePeriod(value))} onDelete={id => void execute(() => removePeriod(id))} onCancel={() => { setDraft(undefined); setMutationError(undefined) }}/>}</main>
}
