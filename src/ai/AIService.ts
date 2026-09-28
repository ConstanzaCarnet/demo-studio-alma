import type { ISODate } from '../domain/types'
import { cleanLine, LIMITS } from '../lib/sanitize'
import { DemoAIProvider } from './demoProvider'
import { daysResponse, slotsResponse } from './flows'
import type { AIContext, AIProvider, AIResponse } from './types'

/** Historial máximo que se le pasa al motor. */
const MAX_HISTORY = 12

/**
 * Punto de entrada único al asistente. La UI sólo conoce esta clase:
 * cambiar de motor no toca componentes.
 *
 * Esta versión usa únicamente el motor demo: respuestas deterministas
 * construidas con los datos de la app. No hay llamadas a APIs externas,
 * no hay claves y no se consumen tokens.
 */
export class AIService {
  constructor(private provider: AIProvider) {}

  get providerName() {
    return this.provider.name
  }

  async ask(message: string, context: AIContext): Promise<AIResponse> {
    const clean = cleanLine(message, LIMITS.chat)
    if (!clean) {
      return { text: 'No llegué a leer tu mensaje. ¿Me contás qué servicio te interesa?' }
    }
    const safeContext: AIContext = {
      ...context,
      history: context.history.slice(-MAX_HISTORY).map((m) => ({ role: m.role, text: cleanLine(m.text, LIMITS.chat) })),
    }
    try {
      return await this.provider.ask(clean, safeContext)
    } catch {
      return {
        text: 'Tuve un problema para responder. Probá de nuevo en un momento o escribinos por WhatsApp.',
        actions: [{ type: 'whatsapp', label: 'Consultar por WhatsApp', message: 'Hola, tengo una consulta.' }],
      }
    }
  }

  /** Eventos de UI (tocar un servicio/día): se resuelven con datos, sin pasar por el modelo. */
  selectService(serviceId: string, context: AIContext): AIResponse {
    context.memory.serviceId = serviceId
    context.memory.pendingOffer = undefined
    if (context.memory.date) return slotsResponse(serviceId, context.memory.professionalId, context.memory.date, context.memory.partOfDay)
    return daysResponse(serviceId, context.memory.professionalId, context.memory.range)
  }

  selectDay(serviceId: string, professionalId: string, date: ISODate, context: AIContext): AIResponse {
    context.memory.date = date
    return slotsResponse(serviceId, professionalId, date, context.memory.partOfDay)
  }
}

export const aiService = new AIService(new DemoAIProvider())
