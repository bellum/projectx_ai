import type { Timestamp } from 'firebase/firestore'

export type PeriodIntensity = 'light' | 'medium' | 'hard'
export interface RawPeriodRecord { startedAt: Timestamp; endedAt: Timestamp; isEnded: true; comment?: string; intensity?: PeriodIntensity }
export interface Period { id: string; start: IsoDate; end: IsoDate; comment: string; intensity?: PeriodIntensity }
export interface PeriodDraft { id?: string; start: IsoDate; end: IsoDate; comment: string; intensity?: PeriodIntensity; touchedIds: string[]; merged: boolean }
export interface Prediction { date?: IsoDate; intervalDays?: number; sampleCount: number; unavailable: string }
export interface IntervalSample { periodId: string; previousStart?: IsoDate; start: IsoDate; end: IsoDate; intervalDays: number; intensity?: PeriodIntensity }
export interface PeriodAnalytics { periodCount: number; latest?: Pick<Period, 'id' | 'start' | 'end'>; intervals: IntervalSample[] }
export type IsoDate = `${number}-${string}-${string}`
