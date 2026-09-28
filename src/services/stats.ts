import type { AppData, Appointment, AppointmentStatus, Client, ISODate } from '../domain/types'
import { addDays, timeToMin } from '../lib/dates'
import { workingWindow } from './availability'

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmed: 'Confirmado',
  pending: 'Pendiente',
  completed: 'Completado',
  cancelled: 'Cancelado',
  no_show: 'Ausente',
}

const earns = (a: Appointment) => a.status !== 'cancelled' && a.status !== 'no_show'

export const byTime = (a: Appointment, b: Appointment) => (a.date + a.start).localeCompare(b.date + b.start)

export function appointmentsOn(data: AppData, date: ISODate) {
  return data.appointments.filter((a) => a.date === date).sort(byTime)
}

export function daySummary(data: AppData, date: ISODate) {
  const list = appointmentsOn(data, date)
  const count = (st: AppointmentStatus) => list.filter((a) => a.status === st).length
  return {
    total: list.length,
    confirmed: count('confirmed') + count('completed'),
    pending: count('pending'),
    cancelled: count('cancelled') + count('no_show'),
    revenue: list.filter(earns).reduce((sum, a) => sum + a.price, 0),
  }
}

/** Turnos por día (lunes a sábado) de la semana que empieza en `weekStart`. */
export function weekSeries(data: AppData, weekStart: ISODate) {
  return Array.from({ length: 6 }, (_, i) => {
    const date = addDays(weekStart, i)
    const list = data.appointments.filter((a) => a.date === date && earns(a))
    return { date, count: list.length, revenue: list.reduce((s, a) => s + a.price, 0) }
  })
}

/** Porcentaje de la jornada de cada profesional ocupada con turnos. */
export function occupancy(data: AppData, date: ISODate) {
  return data.professionals.map((p) => {
    const w = workingWindow(p, date)
    if (!w) return { professional: p, pct: null as number | null, minutes: 0 }
    const total =
      timeToMin(w.end) - timeToMin(w.start) - w.breaks.reduce((s, b) => s + timeToMin(b.end) - timeToMin(b.start), 0)
    const minutes = data.appointments
      .filter((a) => a.professionalId === p.id && a.date === date && earns(a))
      .reduce((s, a) => s + a.durationMin, 0)
    return { professional: p, pct: Math.min(100, Math.round((minutes / total) * 100)), minutes }
  })
}

export function topServices(data: AppData, from: ISODate, to: ISODate) {
  const counts = new Map<string, number>()
  data.appointments
    .filter((a) => a.date >= from && a.date <= to && earns(a))
    .forEach((a) => counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1))
  return [...counts.entries()]
    .map(([serviceId, count]) => ({ service: data.services.find((s) => s.id === serviceId)!, count }))
    .filter((x) => x.service)
    .sort((a, b) => b.count - a.count)
}

export interface ClientStats {
  client: Client
  total: number
  lastVisit?: Appointment
  nextVisit?: Appointment
  favoriteServiceId?: string
  spent: number
  history: Appointment[]
}

export function clientStats(data: AppData, client: Client, today: ISODate): ClientStats {
  const history = data.appointments.filter((a) => a.clientId === client.id).sort(byTime).reverse()
  const done = history.filter((a) => a.status === 'completed')
  const counts = new Map<string, number>()
  history.filter(earns).forEach((a) => counts.set(a.serviceId, (counts.get(a.serviceId) ?? 0) + 1))
  const favoriteServiceId = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
  const upcoming = history.filter((a) => a.date >= today && (a.status === 'confirmed' || a.status === 'pending'))
  return {
    client,
    total: history.filter((a) => a.status !== 'cancelled').length,
    lastVisit: done[0],
    nextVisit: upcoming[upcoming.length - 1],
    favoriteServiceId,
    spent: done.reduce((s, a) => s + a.price, 0),
    history,
  }
}
