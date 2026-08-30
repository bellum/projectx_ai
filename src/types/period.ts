import type { Timestamp } from 'firebase/firestore'

export interface RawPeriodRecord { startedAt: Timestamp; endedAt: Timestamp; isEnded: true; comment?: string }
export interface Period { id: string; start: IsoDate; end: IsoDate; comment: string }
export interface PeriodDraft { id?: string; start: IsoDate; end: IsoDate; comment: string; touchedIds: string[]; merged: boolean }
export interface Prediction { date?: IsoDate; gapDays?: number; sampleCount: number; unavailable: string }
export type IsoDate = `${number}-${string}-${string}`
