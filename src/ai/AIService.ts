import type { ISODate } from '../domain/types'
import { DemoAIProvider } from './demoProvider'
import { daysResponse, slotsResponse } from './flows'
import { RemoteAIProvider } from './remoteProvider'
import type { AIContext, AIProvider, AIResponse } from './types'

/**
 * Punto de entrada único al asistente. La UI sólo conoce esta clase:
 * cambiar de motor (demo → un LLM real) no toca componentes.
 */
export class AIService {
  constructor(private provider: AIProvider) {}

  get providerName() {
    return this.provider.name
  }

  async ask(message: string, context: AIContext): Promise<AIResponse> {
    try {
      return await this.provider.ask(message, context)
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

const provider: AIProvider =
  import.meta.env.VITE_AI_PROVIDER === 'remote' && import.meta.env.VITE_AI_ENDPOINT
    ? new RemoteAIProvider(import.meta.env.VITE_AI_ENDPOINT)
    : new DemoAIProvider()

export const aiService = new AIService(provider)
