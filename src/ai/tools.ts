import { business } from '../data/business'
import type { ISODate } from '../domain/types'
import { addDays, todayISO } from '../lib/dates'
import { normalize } from '../lib/format'
import { eligibleProfessionals } from '../services/availability'
import { ANY_PROFESSIONAL, queryDay, queryRange } from '../services/bookingService'
import { store } from '../services/store'

/**
 * "Herramientas" del asistente: la única forma en que la IA accede a datos.
 * El modo demo las llama directamente; un LLM real las recibe como
 * function-calling (ver `toolDefinitions`) y el backend las ejecuta.
 * Así la IA nunca inventa servicios, precios ni horarios.
 */

export function listServices() {
  const { services, professionals } = store.getState()
  return services
    .filter((s) => s.active)
    .map((s) => ({ ...s, professionals: eligibleProfessionals(s, professionals).map((p) => p.name) }))
}

export function getService(id: string) {
  return listServices().find((s) => s.id === id)
}

const CATEGORY_WORDS: Record<string, string[]> = {
  cabello: ['pelo', 'cabello', 'peinado', 'peinar', 'melena', 'rulos'],
  manos: ['uñas', 'manos', 'mano'],
  rostro: ['cara', 'piel', 'rostro', 'cutis'],
}

const hasWord = (text: string, word: string) => new RegExp(`(^|[^a-zñ])${word}([^a-zñ]|$)`).test(text)

/** Busca servicios por nombre, palabras clave y categoría. Devuelve ordenado por relevancia. */
export function findServices(query: string) {
  const t = normalize(query)
  const categories = Object.entries(CATEGORY_WORDS)
    .filter(([, words]) => words.some((w) => hasWord(t, w)))
    .map(([cat]) => cat)

  return listServices()
    .map((s) => {
      let score = 0
      if (t.includes(normalize(s.name))) score += 5
      for (const k of s.keywords) if (hasWord(t, normalize(k))) score += 1
      if (score > 0 && categories.includes(s.category)) score += 1
      if (score > 0 && categories.length && !categories.includes(s.category)) score = 0
      return { service: s, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.service)
}

export function listProfessionals() {
  const { services, professionals } = store.getState()
  return professionals
    .filter((p) => p.active)
    .map((p) => ({ ...p, services: services.filter((s) => s.active && s.professionalIds.includes(p.id)).map((s) => s.name) }))
}

export function findProfessional(query: string) {
  const t = normalize(query)
  return listProfessionals().find((p) => hasWord(t, normalize(p.name)))
}

export function checkAvailability(serviceId: string, date: ISODate, professionalId = ANY_PROFESSIONAL) {
  return queryDay(serviceId, professionalId, date)
}

/** Próximos días con lugar dentro de un rango (por defecto, la ventana de reservas). */
export function nextAvailableDays(serviceId: string, professionalId = ANY_PROFESSIONAL, from = todayISO(), to?: ISODate, limit = 6) {
  const last = to ?? addDays(todayISO(), business.bookingWindowDays)
  const days = Math.max(1, Math.round((new Date(last).getTime() - new Date(from).getTime()) / 86400000) + 1)
  return queryRange(serviceId, professionalId, from, days)
    .filter((d) => d.availableCount > 0)
    .slice(0, limit)
}

export function getBusinessInfo() {
  return business
}

export function findPolicy(query: string) {
  const t = normalize(query)
  return business.policies.find((p) => p.keywords.some((k) => t.includes(normalize(k))))
}

/** Esquemas para function-calling de un LLM real (formato JSON Schema genérico). */
export const toolDefinitions = [
  { name: 'list_services', description: 'Lista servicios activos con precio, duración y profesionales.', input_schema: { type: 'object', properties: {} } },
  { name: 'list_professionals', description: 'Lista el equipo con especialidad y servicios.', input_schema: { type: 'object', properties: {} } },
  {
    name: 'check_availability',
    description: 'Horarios libres para un servicio en una fecha. Única fuente válida de disponibilidad.',
    input_schema: {
      type: 'object',
      properties: {
        service_id: { type: 'string' },
        date: { type: 'string', description: 'YYYY-MM-DD' },
        professional_id: { type: 'string', description: 'Opcional; "any" para cualquiera' },
      },
      required: ['service_id', 'date'],
    },
  },
  {
    name: 'next_available_days',
    description: 'Próximos días con lugar para un servicio.',
    input_schema: { type: 'object', properties: { service_id: { type: 'string' }, professional_id: { type: 'string' } }, required: ['service_id'] },
  },
  { name: 'get_business_info', description: 'Dirección, horarios de atención, contacto y políticas.', input_schema: { type: 'object', properties: {} } },
  {
    name: 'propose_booking',
    description: 'Muestra al cliente un horario ya verificado para que complete sus datos. NO confirma el turno.',
    input_schema: {
      type: 'object',
      properties: { service_id: { type: 'string' }, professional_id: { type: 'string' }, date: { type: 'string' }, time: { type: 'string' } },
      required: ['service_id', 'date', 'time'],
    },
  },
] as const
