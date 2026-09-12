import { daysBetween } from './dateUtils'
import type { IsoDate, Period } from '../types/period'

export function shouldShowCurrentAndNextOnMobile(periods: Period[], today: IsoDate, mobile: boolean) {
  const latestEnd = periods.reduce<IsoDate | undefined>((latest, period) => !latest || period.end > latest ? period.end : latest, undefined)
  const daysSinceLatestEnd = latestEnd ? daysBetween(latestEnd, today) : undefined
  return mobile && daysSinceLatestEnd !== undefined && daysSinceLatestEnd >= 0 && daysSinceLatestEnd <= 7
}
