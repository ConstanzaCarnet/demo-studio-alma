import { business } from '../data/business'
import type { Appointment, AppointmentStatus, DaySchedule, ISODate, Professional, Service, Time, TimeRange } from '../domain/types'
import { addDays, minToTime, nowMinutes, timeToMin, todayISO, weekdayOf } from '../lib/dates'

/**
 * Motor de disponibilidad. Es la ÚNICA fuente de verdad sobre horarios:
 * lo usan el flujo de reserva, el asistente y la validación final al reservar.
 *
 * Considera: horario del negocio, horario del profesional, descansos,
 * días no laborables, duración del servicio, turnos existentes y anticipación mínima.
 */

/** Estados que ocupan la agenda (un turno cancelado libera el horario). */
const BLOCKING: AppointmentStatus[] = ['confirmed', 'pending', 'completed', 'no_show']

export type DayUnavailableReason = 'past' | 'closed' | 'holiday' | 'professional_off' | 'full' | 'too_far'

export interface SlotOption {
  time: Time
  available: boolean
  /** Profesionales libres en ese horario (vacío si está ocupado). */
  professionalIds: string[]
}

export interface DayAvailability {
  date: ISODate
  slots: SlotOption[]
  availableCount: number
  reason?: DayUnavailableReason
  reasonLabel?: string
}

export interface AvailabilityQuery {
  service: Service
  /** Profesionales candidatos (uno específico o todos los que hacen el servicio). */
  professionals: Professional[]
  date: ISODate
  appointments: Appointment[]
  now?: Date
  /** Para generar datos semilla sin filtrar horarios pasados. */
  ignorePast?: boolean
}

const overlaps = (aStart: number, aEnd: number, bStart: number, bEnd: number) => aStart < bEnd && bStart < aEnd

function intersect(a: TimeRange, b: TimeRange): TimeRange | null {
  const start = Math.max(timeToMin(a.start), timeToMin(b.start))
  const end = Math.min(timeToMin(a.end), timeToMin(b.end))
  return end > start ? { start: minToTime(start), end: minToTime(end) } : null
}

export function isHoliday(date: ISODate) {
  return business.closedDates.find((d) => d.date === date)
}

export function businessHoursFor(date: ISODate): DaySchedule | null {
  if (isHoliday(date)) return null
  return business.hours[weekdayOf(date)] ?? null
}

/** Ventana de trabajo efectiva de un profesional en una fecha (negocio ∩ profesional). */
export function workingWindow(pro: Professional, date: ISODate): (TimeRange & { breaks: TimeRange[] }) | null {
  const biz = businessHoursFor(date)
  const own = pro.schedule[weekdayOf(date)]
  if (!biz || !own || !pro.active) return null
  const w = intersect(biz, own)
  return w ? { ...w, breaks: [...own.breaks, ...biz.breaks] } : null
}

export function eligibleProfessionals(service: Service, professionals: Professional[]): Professional[] {
  return professionals.filter((p) => p.active && service.professionalIds.includes(p.id))
}

export function getDayAvailability(q: AvailabilityQuery): DayAvailability {
  const { service, professionals, date, appointments, now = new Date(), ignorePast = false } = q
  const today = todayISO(now)
  const empty = (reason: DayUnavailableReason, reasonLabel: string): DayAvailability => ({
    date,
    slots: [],
    availableCount: 0,
    reason,
    reasonLabel,
  })

  if (!ignorePast && date < today) return empty('past', 'Fecha pasada')
  if (!ignorePast && date > addDays(today, business.bookingWindowDays)) return empty('too_far', 'Agenda aún no habilitada')
  const holiday = isHoliday(date)
  if (holiday) return empty('holiday', holiday.reason)
  if (!businessHoursFor(date)) return empty('closed', 'Cerrado')

  const duration = service.durationMin
  const step = business.slotStepMin
  const minStart = !ignorePast && date === today ? nowMinutes(now) + business.minLeadMin : 0

  // time -> { libres, ocupados por turno }
  const byTime = new Map<number, { free: string[]; taken: boolean }>()
  let anyWorking = false

  for (const pro of professionals) {
    const w = workingWindow(pro, date)
    if (!w) continue
    anyWorking = true
    const busy = appointments
      .filter((a) => a.professionalId === pro.id && a.date === date && BLOCKING.includes(a.status))
      .map((a) => [timeToMin(a.start), timeToMin(a.start) + a.durationMin] as const)
    const breaks = w.breaks.map((b) => [timeToMin(b.start), timeToMin(b.end)] as const)

    for (let t = timeToMin(w.start); t + duration <= timeToMin(w.end); t += step) {
      if (t < minStart) continue
      if (breaks.some(([s, e]) => overlaps(t, t + duration, s, e))) continue
      const entry = byTime.get(t) ?? { free: [], taken: false }
      if (busy.some(([s, e]) => overlaps(t, t + duration, s, e))) entry.taken = true
      else entry.free.push(pro.id)
      byTime.set(t, entry)
    }
  }

  if (!anyWorking) return empty('professional_off', 'No atiende este día')

  const slots: SlotOption[] = [...byTime.entries()]
    .sort(([a], [b]) => a - b)
    .map(([t, e]) => ({ time: minToTime(t), available: e.free.length > 0, professionalIds: e.free }))

  const availableCount = slots.filter((s) => s.available).length
  if (availableCount === 0) {
    return { date, slots, availableCount, reason: 'full', reasonLabel: date === today && slots.length === 0 ? 'Sin horarios por hoy' : 'Completo' }
  }
  return { date, slots, availableCount }
}

export function getAvailabilityRange(q: Omit<AvailabilityQuery, 'date'> & { from: ISODate; days: number }): DayAvailability[] {
  return Array.from({ length: q.days }, (_, i) => getDayAvailability({ ...q, date: addDays(q.from, i) }))
}

/** Verificación final antes de guardar un turno. Devuelve el profesional asignado o null. */
export function resolveSlot(q: AvailabilityQuery & { time: Time }): string | null {
  const day = getDayAvailability(q)
  const slot = day.slots.find((s) => s.time === q.time && s.available)
  return slot ? slot.professionalIds[0] : null
}
