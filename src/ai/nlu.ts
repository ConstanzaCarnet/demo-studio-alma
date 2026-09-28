import type { ISODate } from '../domain/types'
import { addDays, formatLongDate, startOfWeek, todayISO, weekdayOf } from '../lib/dates'
import { normalize } from '../lib/format'
import type { DateRange, PartOfDay } from './types'

/**
 * Comprensión de lenguaje básica para el modo demo (español rioplatense).
 * Con un LLM real esto lo resuelve el modelo; se mantiene aislado a propósito.
 */

export function prepare(message: string): string {
  return normalize(message)
    .replace(/[¿?¡!.,;]/g, ' ')
    .replace(/\b(las|mis|de|en|hacerme) unas\b/g, '$1 uñas') // "unas" escrito sin ñ
    .replace(/\bmanana\b/g, 'mañana')
    .replace(/\s+/g, ' ')
    .trim()
}

const WEEKDAYS = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export interface ParsedDate {
  date?: ISODate
  range?: DateRange
  partOfDay?: PartOfDay
}

export function parseDate(t: string, today = todayISO()): ParsedDate {
  const out: ParsedDate = {}
  let s = t

  if (/\b(a|por|en) la mañana\b|\btemprano\b/.test(s)) {
    out.partOfDay = 'morning'
    s = s.replace(/\b(a|por|en) la mañana\b/g, ' ')
  } else if (/\b(a|por|en) la tarde\b|\bdespues del mediodia\b/.test(s)) out.partOfDay = 'afternoon'
  else if (/\b(a|por|en) la noche\b|\bultima hora\b|\bdespues del trabajo\b/.test(s)) out.partOfDay = 'evening'

  if (/\bpasado mañana\b/.test(s)) out.date = addDays(today, 2)
  else if (/\bhoy\b/.test(s)) out.date = today
  else if (/\bmañana\b/.test(s)) out.date = addDays(today, 1)

  if (!out.date) {
    const wd = WEEKDAYS.findIndex((d) => new RegExp(`\\b${d}\\b`).test(s))
    if (wd >= 0) {
      let diff = (wd - weekdayOf(today) + 7) % 7
      if (diff === 0 && /\b(proximo|que viene)\b/.test(s)) diff = 7
      out.date = addDays(today, diff)
    }
  }

  if (!out.date) {
    const m = s.match(/\b(\d{1,2})\/(\d{1,2})\b/) ?? s.match(/\b(?:el|dia) (\d{1,2})\b(?! ?(hs|h|horas|:))/)
    if (m) {
      const day = Number(m[1])
      const [y, mo] = today.split('-').map(Number)
      const month = m[2] ? Number(m[2]) : mo
      let candidate = `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      if (!m[2] && candidate < today) {
        const next = new Date(y, mo, day)
        candidate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      }
      if (day >= 1 && day <= 31) out.date = candidate
    }
  }

  if (!out.date) {
    if (/\b(esta semana|en la semana)\b/.test(s)) {
      out.range = { from: today, to: addDays(startOfWeek(today), 5), label: 'esta semana' }
    } else if (/\b(semana que viene|proxima semana)\b/.test(s)) {
      const mon = addDays(startOfWeek(today), 7)
      out.range = { from: mon, to: addDays(mon, 5), label: 'la semana que viene' }
    } else if (/\b(fin de semana|finde)\b/.test(s)) {
      const sat = addDays(startOfWeek(today), 5)
      out.date = sat < today ? addDays(sat, 7) : sat
    }
  }
  return out
}

export function describeDate(date: ISODate, today = todayISO()): string {
  if (date === today) return `hoy (${formatLongDate(date).toLowerCase()})`
  if (date === addDays(today, 1)) return `mañana ${formatLongDate(date).toLowerCase()}`
  return `el ${formatLongDate(date).toLowerCase()}`
}

export const intents = {
  greeting: (t: string) => /^(hola|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal)\b/.test(t) && t.split(' ').length <= 4,
  thanks: (t: string) => /\b(gracias|genial gracias|muchas gracias|mil gracias)\b/.test(t),
  affirm: (t: string) => /^(si|sip|dale|ok|oka|okey|bueno|perfecto|de una|claro|genial|por favor|obvio|me parece|buscame|busca)\b/.test(t),
  negate: (t: string) => /^(no|nop|nah|no gracias)\b/.test(t),
  price: (t: string) => /\b(cuanto (sale|cuesta|vale|esta|es|cobran)|precio|precios|valor|costo|tarifa|cobran)\b/.test(t),
  duration: (t: string) => /\b(cuanto (dura|tarda|demora|lleva|tiempo)|duracion|dura)\b/.test(t),
  availability: (t: string) =>
    /\b(horario|horarios|turno|turnos|disponib\w*|lugar|hueco|reserv\w*|agendar|sacar|cuando (puedo|tienen|hay)|tienen para|hay para)\b/.test(t),
  recommend: (t: string) =>
    /\b(recomend\w*|que me (hago|conviene)|no se que|sugeri\w*|aconsej\w*|fiesta|evento|casamiento|boda|cumple\w*|egresad\w*|arreglarme|mimarme|regalo)\b/.test(t),
  services: (t: string) => /\b(servicios|que hacen|que ofrecen|que tienen|lista|carta|menu)\b/.test(t),
  team: (t: string) => /\b(quien|quienes|profesional|profesionales|equipo|chicas|estilistas?)\b/.test(t),
  address: (t: string) => /\b(donde|direccion|ubicacion|ubicados|como llego|queda|estan)\b/.test(t),
  openingHours: (t: string) => /\b(abren|cierran|atienden|horario de atencion|horarios de atencion|que dias)\b/.test(t),
  cancel: (t: string) => /\b(cancelar|cancelo|reprogramar|cambiar (el|mi) turno|mover (el|mi) turno|no puedo ir)\b/.test(t),
  contact: (t: string) => /\b(telefono|whatsapp|contacto|hablar con|persona|humano|llamar)\b/.test(t),
}
