import { business } from '../data/business'
import type { ISODate, Time } from '../domain/types'
import { minToTime, timeToMin } from './dates'

interface CalendarEvent {
  title: string
  description: string
  date: ISODate
  start: Time
  durationMin: number
}

const stamp = (date: ISODate, time: Time) => `${date.replaceAll('-', '')}T${time.replace(':', '')}00`
const endOf = (e: CalendarEvent) => minToTime(timeToMin(e.start) + e.durationMin)
const location = () => `${business.address}, ${business.city}`
/** Escapa texto para un campo .ics (RFC 5545): evita inyectar líneas o propiedades. */
const icsText = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n|\r/g, '\\n')

export function googleCalendarUrl(e: CalendarEvent): string {
  const qs = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    details: e.description,
    location: location(),
    dates: `${stamp(e.date, e.start)}/${stamp(e.date, endOf(e))}`,
    ctz: 'America/Argentina/Cordoba',
  })
  return `https://calendar.google.com/calendar/render?${qs}`
}

export function downloadIcs(e: CalendarEvent) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Studio Alma//Turnos//ES',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@studioalma.demo`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${stamp(e.date, e.start)}`,
    `DTEND:${stamp(e.date, endOf(e))}`,
    `SUMMARY:${icsText(e.title)}`,
    `DESCRIPTION:${icsText(e.description)}`,
    `LOCATION:${icsText(location())}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Recordatorio de turno',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: 'turno-studio-alma.ics' })
  a.click()
  URL.revokeObjectURL(url)
}
