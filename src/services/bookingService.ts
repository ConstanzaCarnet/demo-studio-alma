import type { Appointment, AppointmentSource, Client, ISODate, Time } from '../domain/types'
import { uid } from '../lib/format'
import { eligibleProfessionals, getAvailabilityRange, getDayAvailability, resolveSlot } from './availability'
import { store } from './store'

export const ANY_PROFESSIONAL = 'any'

export interface BookingRequest {
  serviceId: string
  /** Id de profesional o ANY_PROFESSIONAL. */
  professionalId: string
  date: ISODate
  time: Time
  client: { firstName: string; lastName: string; phone: string; email?: string }
  comment?: string
  source: AppointmentSource
}

export class BookingError extends Error {
  constructor(
    public code: 'SLOT_TAKEN' | 'NOT_FOUND' | 'INVALID',
    message: string,
  ) {
    super(message)
  }
}

function candidates(serviceId: string, professionalId: string) {
  const { services, professionals } = store.getState()
  const service = services.find((s) => s.id === serviceId && s.active)
  if (!service) throw new BookingError('NOT_FOUND', 'El servicio no está disponible.')
  const eligible = eligibleProfessionals(service, professionals)
  const pros = professionalId === ANY_PROFESSIONAL ? eligible : eligible.filter((p) => p.id === professionalId)
  return { service, pros }
}

/** Consulta de disponibilidad para la UI y el asistente. */
export function queryDay(serviceId: string, professionalId: string, date: ISODate) {
  const { service, pros } = candidates(serviceId, professionalId)
  return getDayAvailability({ service, professionals: pros, date, appointments: store.getState().appointments })
}

export function queryRange(serviceId: string, professionalId: string, from: ISODate, days: number) {
  const { service, pros } = candidates(serviceId, professionalId)
  return getAvailabilityRange({ service, professionals: pros, from, days, appointments: store.getState().appointments })
}

const phoneDigits = (p: string) => p.replace(/\D/g, '').slice(-8)

/**
 * Crea un turno. Vuelve a verificar la disponibilidad contra el estado actual
 * inmediatamente antes de guardar: así se evita la doble reserva aunque la
 * UI (o el asistente) haya mostrado un horario que ya fue tomado.
 */
export async function createBooking(req: BookingRequest): Promise<{ appointment: Appointment; client: Client }> {
  await new Promise((r) => setTimeout(r, 650)) // latencia simulada de red
  const { firstName, lastName, phone } = req.client
  if (!firstName.trim() || !lastName.trim() || phoneDigits(phone).length < 8) {
    throw new BookingError('INVALID', 'Revisá tus datos de contacto.')
  }

  const { service, pros } = candidates(req.serviceId, req.professionalId)
  const state = store.getState()
  const professionalId = resolveSlot({ service, professionals: pros, date: req.date, time: req.time, appointments: state.appointments })
  if (!professionalId) {
    throw new BookingError('SLOT_TAKEN', 'Ese horario acaba de ocuparse. Elegí otro, por favor.')
  }

  let client = state.clients.find((c) => phoneDigits(c.phone) === phoneDigits(phone))
  const newClient = !client
  if (!client) {
    client = {
      id: uid('cli'),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      email: req.client.email?.trim() || undefined,
      createdAt: new Date().toISOString(),
    }
  }

  const appointment: Appointment = {
    id: uid('apt'),
    serviceId: service.id,
    professionalId,
    clientId: client.id,
    date: req.date,
    start: req.time,
    durationMin: service.durationMin,
    price: service.price,
    status: 'confirmed',
    comment: req.comment?.trim() || undefined,
    source: req.source,
    createdAt: new Date().toISOString(),
  }

  const saved = client
  store.setState((s) => ({
    clients: newClient ? [...s.clients, saved] : s.clients,
    appointments: [...s.appointments, appointment],
  }))
  return { appointment, client }
}
