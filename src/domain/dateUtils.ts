import { Timestamp } from 'firebase/firestore'
import type { IsoDate } from '../types/period'

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export function parseIsoDay(day: string): Date {
  const parts = ISO.exec(day)
  if (!parts) throw new Error(`Invalid ISO date: ${day}`)
  const date = new Date(Date.UTC(Number(parts[1]), Number(parts[2]) - 1, Number(parts[3])))
  if (formatIsoDay(date) !== day) throw new Error(`Invalid calendar date: ${day}`)
  return date
}
export function formatIsoDay(date: Date): IsoDate {
  return date.toISOString().slice(0, 10) as IsoDate
}
export function timestampToIsoDay(timestamp: Timestamp): IsoDate {
  return formatIsoDay(new Date(timestamp.toMillis() + 12 * 60 * 60 * 1000))
}
export function isoDayToTimestamp(day: IsoDate): Timestamp { return Timestamp.fromDate(parseIsoDay(day)) }
export function addDays(day: IsoDate, days: number): IsoDate {
  const date = parseIsoDay(day); date.setUTCDate(date.getUTCDate() + days); return formatIsoDay(date)
}
export function daysBetween(from: IsoDate, to: IsoDate): number { return Math.round((parseIsoDay(to).getTime() - parseIsoDay(from).getTime()) / 86_400_000) }
export function compareDays(a: IsoDate, b: IsoDate): number { return a.localeCompare(b) }
export function todayIsoDay(now = new Date()): IsoDate { return formatIsoDay(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))) }
export function isFuture(day: IsoDate, today = todayIsoDay()): boolean { return compareDays(day, today) > 0 }
export function startOfMonth(day: IsoDate): IsoDate { return `${day.slice(0, 7)}-01` as IsoDate }
export function addMonths(monthDay: IsoDate, months: number): IsoDate {
  const date = parseIsoDay(startOfMonth(monthDay)); date.setUTCMonth(date.getUTCMonth() + months); return formatIsoDay(date)
}
export function monthLabel(monthDay: IsoDate): string { return new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(parseIsoDay(monthDay)) }
export function daysInMonth(monthDay: IsoDate): number { const d = parseIsoDay(startOfMonth(monthDay)); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() }
export function weekdayOffset(monthDay: IsoDate): number { return parseIsoDay(startOfMonth(monthDay)).getUTCDay() }
