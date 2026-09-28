import type { AIContext, AIProvider, AIResponse } from './types'

/**
 * Proveedor para un LLM real (OpenAI, Gemini, etc.).
 *
 * La API key NUNCA va en el navegador: este proveedor llama a un endpoint
 * propio (p. ej. una función serverless) que:
 *   1. arma el prompt de sistema con las reglas del negocio,
 *   2. envía el historial + `toolDefinitions` (ver tools.ts) al modelo,
 *   3. ejecuta las herramientas que el modelo pida contra la misma lógica
 *      de disponibilidad que usa la app,
 *   4. devuelve un AIResponse (texto + widgets + acciones).
 *
 * Para activarlo: VITE_AI_PROVIDER=remote y VITE_AI_ENDPOINT=/api/assistant
 */
export class RemoteAIProvider implements AIProvider {
  readonly name = 'remote'

  constructor(private endpoint: string) {}

  async ask(message: string, ctx: AIContext): Promise<AIResponse> {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history: ctx.history, memory: ctx.memory, now: ctx.now.toISOString() }),
    })
    if (!res.ok) throw new Error(`Assistant endpoint error ${res.status}`)
    const data = (await res.json()) as AIResponse & { memory?: AIContext['memory'] }
    if (data.memory) Object.assign(ctx.memory, data.memory)
    return data
  }
}
