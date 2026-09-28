import type { ISODate } from '../domain/types'
import { formatDuration, formatLongDate, timeToMin, todayISO } from '../lib/dates'
import { formatPrice } from '../lib/format'
import { ANY_PROFESSIONAL } from '../services/bookingService'
import { describeDate } from './nlu'
import { checkAvailability, getService, listProfessionals, nextAvailableDays } from './tools'
import type { AIResponse, DateRange, PartOfDay } from './types'

/**
 * Respuestas deterministas construidas sobre las herramientas.
 * Las usa el modo demo y también la UI del chat cuando el usuario toca
 * un servicio, día u horario (no hace falta pasar por el modelo para eso).
 */

export const serviceLine = (id: string) => {
  const s = getService(id)
  return s ? `${s.name} (${formatDuration(s.durationMin)} · ${formatPrice(s.price)})` : ''
}

const proName = (id?: string) => listProfessionals().find((p) => p.id === id)?.name

const PART_LABEL: Record<PartOfDay, string> = { morning: 'a la mañana', afternoon: 'a la tarde', evening: 'a última hora' }
const inPart = (time: string, part?: PartOfDay) => {
  if (!part) return true
  const m = timeToMin(time)
  return part === 'morning' ? m < 13 * 60 : part === 'afternoon' ? m >= 13 * 60 && m < 18 * 60 : m >= 17 * 60
}

export function daysResponse(serviceId: string, professionalId = ANY_PROFESSIONAL, range?: DateRange): AIResponse {
  const service = getService(serviceId)
  if (!service) return { text: 'Ese servicio no está disponible en este momento.' }
  const withPro = professionalId !== ANY_PROFESSIONAL ? ` con ${proName(professionalId)}` : ''

  let days = nextAvailableDays(serviceId, professionalId, range?.from ?? todayISO(), range?.to)
  let prefix = ''
  if (!days.length && range) {
    prefix = `No me quedan lugares ${range.label} para ${service.name}${withPro}. `
    days = nextAvailableDays(serviceId, professionalId)
  }
  if (!days.length) {
    return {
      text: `${prefix}No encontré horarios disponibles para ${service.name}${withPro} en las próximas semanas. Te sugiero escribirnos por WhatsApp y te avisamos si se libera un lugar.`,
      actions: [{ type: 'whatsapp', label: 'Consultar por WhatsApp', message: `Hola, quiero un turno para ${service.name}.` }],
    }
  }
  return {
    text: `${prefix}Estos son los próximos días con lugar para ${service.name}${withPro}. ¿Qué día te queda mejor?`,
    widgets: [{ type: 'days', serviceId, professionalId, days: days.map((d) => ({ date: d.date, availableCount: d.availableCount })) }],
  }
}

export function slotsResponse(
  serviceId: string,
  professionalId: string = ANY_PROFESSIONAL,
  date: ISODate,
  partOfDay?: PartOfDay,
): AIResponse {
  const service = getService(serviceId)
  if (!service) return { text: 'Ese servicio no está disponible en este momento.' }
  const day = checkAvailability(serviceId, date, professionalId)
  const withPro = professionalId !== ANY_PROFESSIONAL ? ` con ${proName(professionalId)}` : ''
  const when = describeDate(date)

  const free = day.slots.filter((s) => s.available)
  if (!free.length) {
    const reason =
      day.reason === 'closed' || day.reason === 'holiday'
        ? `${formatLongDate(date)} estamos cerrados${day.reason === 'holiday' ? ` (${day.reasonLabel?.toLowerCase()})` : ''}.`
        : day.reason === 'professional_off'
          ? `${when} no hay profesionales de ${service.name}${withPro} trabajando.`
          : day.reason === 'past'
            ? 'Esa fecha ya pasó.'
            : `${when.charAt(0).toUpperCase() + when.slice(1)} ya no quedan horarios para ${service.name}${withPro}.`
    const alt = daysResponse(serviceId, professionalId)
    return { ...alt, text: `${reason} ${alt.widgets ? 'Te muestro los próximos días con lugar:' : alt.text}` }
  }

  const preferred = free.filter((s) => inPart(s.time, partOfDay))
  const shown = (preferred.length ? preferred : free).slice(0, 10)
  const partNote = partOfDay
    ? preferred.length
      ? ` ${PART_LABEL[partOfDay]}`
      : ` (${PART_LABEL[partOfDay]} no me queda lugar, pero tengo estos)`
    : ''
  return {
    text: `Horarios disponibles para ${service.name}${withPro} ${when}${partNote}. Elegí uno y completás tus datos para confirmar: no reservo nada hasta que vos confirmes.`,
    widgets: [
      {
        type: 'slots',
        serviceId,
        professionalId,
        date,
        slots: shown.map((s) => ({ time: s.time, professionalId: s.professionalIds[0] })),
      },
    ],
  }
}
