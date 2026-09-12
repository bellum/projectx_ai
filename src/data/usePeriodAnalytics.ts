import { useEffect, useState } from 'react'
import { subscribePeriodAnalytics } from './analyticsRepository'
import type { PeriodAnalytics } from '../types/period'

export function usePeriodAnalytics() {
  const [state, setState] = useState<{ value?: PeriodAnalytics; error?: string; loading: boolean }>({ loading: true })
  useEffect(() => subscribePeriodAnalytics(value => setState({ value, loading: false }), error => setState({ error: error.message, loading: false })), [])
  return state
}
