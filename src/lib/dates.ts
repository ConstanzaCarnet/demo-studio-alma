import type { ISODate, Time, Weekday } from '../domain/types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toISODate(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function parseISODate(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO(now = new Date()): ISODate {
  return toISODate(now)
}

export function addDays(date: ISODate, days: number): ISODate {
  const d = parseISODate(date)
  d.setDate(d.getDate() + days)
  return toISODate(d)
}

export function weekdayOf(date: ISODate): Weekday {
  return parseISODate(date).getDay() as Weekday
}

export function timeToMin(t: Time): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

export function minToTime(min: number): Time {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function nowMinutes(now = new Date()): number {
  return now.getHours() * 60 + now.getMinutes()
}

/** Lunes de la semana que contiene la fecha. */
export function startOfWeek(date: ISODate): ISODate {
  const wd = weekdayOf(date)
  return addDays(date, wd === 0 ? -6 : 1 - wd)
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** "Martes 29 de septiembre" */
export function formatLongDate(date: ISODate): string {
  return cap(
    parseISODate(date).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }),
  )
}

/** "Mar 29" */
export function formatShortDay(date: ISODate): { weekday: string; day: number; month: string } {
  const d = parseISODate(date)
  return {
    weekday: cap(d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')),
    day: d.getDate(),
    month: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
  }
}

/** "22/09/2026" */
export function formatNumericDate(date: ISODate): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

/** "Hoy", "Mañana" o "Martes 29 de septiembre". */
export function formatRelativeDate(date: ISODate, today = todayISO()): string {
  if (date === today) return 'Hoy'
  if (date === addDays(today, 1)) return 'Mañana'
  return formatLongDate(date)
}

export const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
