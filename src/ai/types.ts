import type { ISODate, Time } from '../domain/types'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export type PartOfDay = 'morning' | 'afternoon' | 'evening'

export interface DateRange {
  from: ISODate
  to: ISODate
  label: string
}

/** Bloques visuales que el chat renderiza debajo del texto. */
export type AIWidget =
  | { type: 'services'; serviceIds: string[] }
  | { type: 'professionals'; professionalIds: string[] }
  | { type: 'days'; serviceId: string; professionalId: string; days: { date: ISODate; availableCount: number }[] }
  | { type: 'slots'; serviceId: string; professionalId: string; date: ISODate; slots: { time: Time; professionalId: string }[] }

export type AIAction =
  | { type: 'search_slots'; label: string; serviceId: string; professionalId?: string }
  | { type: 'open_booking'; label: string; serviceId?: string; professionalId?: string; date?: ISODate; time?: Time }
  | { type: 'whatsapp'; label: string; message: string }

export interface AIResponse {
  text: string
  widgets?: AIWidget[]
  actions?: AIAction[]
  /** Respuestas rápidas sugeridas (chips). */
  suggestions?: string[]
}

/** Estado de la conversación que el proveedor puede leer y actualizar. */
export interface ConversationMemory {
  serviceId?: string
  professionalId?: string
  date?: ISODate
  range?: DateRange
  partOfDay?: PartOfDay
  /** Última oferta hecha ("¿Querés que busque horarios?") para interpretar un "sí". */
  pendingOffer?: 'search_slots'
}

export interface AIContext {
  history: ChatMessage[]
  memory: ConversationMemory
  now: Date
}

/**
 * Contrato de un motor de IA. Implementación actual:
 *  - DemoAIProvider: reglas + datos reales, sin API (modo demo).
 * Un LLM real se conectaría siempre desde un backend propio (la clave nunca
 * va en el navegador), implementando esta misma interfaz.
 */
export interface AIProvider {
  readonly name: string
  ask(message: string, context: AIContext): Promise<AIResponse>
}
