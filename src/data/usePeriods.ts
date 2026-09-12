import { useEffect, useState } from 'react'
import { subscribePeriods } from './periodRepository'
import type { IsoDate, Period } from '../types/period'

export function usePeriods(from: IsoDate, to: IsoDate, onLoaded?: (periods: Period[]) => void) {
  const [result, setResult] = useState<{ periods: Period[]; from: IsoDate; to: IsoDate; error?: string }>()
  useEffect(() => subscribePeriods(from, to, data => { setResult({ periods: data, from, to }); onLoaded?.(data) }, reason => setResult({ periods: [], from, to, error: reason.message })), [from, onLoaded, to])
  const current = result && result.from === from && result.to === to ? result : undefined
  return { periods: current?.periods ?? [], loading: !current, error: current?.error }
}
