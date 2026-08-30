import { useEffect, useState } from 'react'
import { subscribePeriods } from './periodRepository'
import type { Period } from '../types/period'

export function usePeriods() {
  const [periods, setPeriods] = useState<Period[]>([]), [loading, setLoading] = useState(true), [error, setError] = useState<string>()
  useEffect(() => subscribePeriods(data => { setPeriods(data); setLoading(false); setError(undefined) }, reason => { setError(reason.message); setLoading(false) }), [])
  return { periods, loading, error }
}
