import { useState } from 'react'
import { todayIsoDay } from '../domain/dateUtils'
import { createDraft } from '../domain/periodRules'
import { calculatePredictions } from '../domain/predictions'
import { removePeriod, savePeriod } from '../data/periodRepository'
import { usePeriods } from '../data/usePeriods'
import { useAuth } from '../auth/useAuth'
import type { IsoDate, PeriodDraft } from '../types/period'
import { TwoMonthCalendar } from './TwoMonthCalendar'
import { PeriodEditor } from './PeriodEditor'
import { PredictionSummary } from './PredictionSummary'

export function CalendarPage() {
  const { periods, loading, error: loadError } = usePeriods(), { user, signOut } = useAuth(); const today = todayIsoDay()
  const [anchor, setAnchor] = useState(today.slice(0, 8) + '01' as IsoDate), [start, setStart] = useState<IsoDate>(), [draft, setDraft] = useState<PeriodDraft>(), [pending, setPending] = useState(false), [mutationError, setMutationError] = useState<string>()
  const predictions = calculatePredictions(periods, today)
  const select = (day: IsoDate) => { const existing = periods.find(item => day >= item.start && day <= item.end); if (existing) { setStart(undefined); setDraft(createDraft(periods, existing.start, existing.end, existing)); return } if (!start) { setStart(day); return } setDraft(createDraft(periods, start, day)); setStart(undefined) }
  const execute = async (operation: () => Promise<void>) => { setPending(true); setMutationError(undefined); try { await operation(); setDraft(undefined) } catch (reason) { setMutationError((reason as Error).message || 'Unable to save. Please try again.') } finally { setPending(false) } }
  const changeDates = () => { if (!draft) return; setStart(draft.start); setDraft(undefined) }
  return <main className="page"><header><div><p className="eyebrow">Shared calendar</p><h1>Periods</h1></div><button type="button" onClick={() => void signOut()} aria-label="Sign out">Sign out</button></header><p className="signed-in">Signed in as {user?.email ?? 'Google account'}</p>{loadError ? <p role="alert">Unable to load periods: {loadError}</p> : loading ? <p>Loading periods…</p> : <><p className="instruction">{start ? 'Choose the last day of the period.' : 'Select an unmarked day to start a period, or select a recorded period to edit it.'}</p><TwoMonthCalendar periods={periods} anchor={anchor} selectedStart={start} today={today} predicted={[predictions.latestGap.date, predictions.average.date].filter((value): value is IsoDate => Boolean(value))} onAnchor={setAnchor} onSelect={select}/><PredictionSummary {...predictions}/></>}{draft && <PeriodEditor draft={draft} today={today} pending={pending} error={mutationError} onSave={value => void execute(() => savePeriod(value))} onDelete={id => void execute(() => removePeriod(id))} onChangeDates={changeDates} onCancel={() => { setDraft(undefined); setMutationError(undefined) }}/>}</main>
}
