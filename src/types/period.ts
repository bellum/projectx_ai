import type { Timestamp } from 'firebase/firestore'

export interface RawPeriodRecord { startedAt: Timestamp; endedAt: Timestamp; isEnded: true; comment?: string }
export interface Period { id: string; start: IsoDate; end: IsoDate; comment: string }
export interface PeriodDraft { id?: string; start: IsoDate; end: IsoDate; comment: string; touchedIds: string[]; merged: boolean }
export interface Prediction { date?: IsoDate; gapDays?: number; sampleCount: number; unavailable: string }
export interface GapSample { periodId: string; start: IsoDate; end: IsoDate; gapDays: number }
export interface PeriodAnalytics { periodCount: number; latest?: Pick<Period, 'id' | 'start' | 'end'>; gaps: GapSample[] }
export type IsoDate = `${number}-${string}-${string}`
