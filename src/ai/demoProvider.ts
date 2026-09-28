import { WEEKDAY_NAMES, formatDuration } from '../lib/dates'
import { formatPrice } from '../lib/format'
import { ANY_PROFESSIONAL } from '../services/bookingService'
import { daysResponse, serviceLine, slotsResponse } from './flows'
import { intents, parseDate, prepare } from './nlu'
import { findPolicy, findProfessional, findServices, getBusinessInfo, listProfessionals, listServices } from './tools'
import type { AIContext, AIProvider, AIResponse } from './types'

const DEFAULT_SUGGESTIONS = ['¿Cuánto cuesta un corte?', 'Quiero hacerme las uñas esta semana', '¿Qué me recomendás para una fiesta?']

const joinNames = (names: string[]) =>
  names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`

const think = () => new Promise((r) => setTimeout(r, 450 + Math.random() * 500))

/**
 * Motor de IA en "modo demo": interpreta el mensaje con reglas simples y
 * responde SIEMPRE a partir de las herramientas (datos reales de la app).
 * Se reemplaza por un LLM cambiando el proveedor en `AIService`.
 */
export class DemoAIProvider implements AIProvider {
  readonly name = 'demo'

  async ask(message: string, ctx: AIContext): Promise<AIResponse> {
    await think()
    return this.respond(message, ctx)
  }

  private respond(message: string, ctx: AIContext): AIResponse {
    const t = prepare(message)
    const mem = ctx.memory
    const services = findServices(t)
    const pro = findProfessional(t)
    const when = parseDate(t)
    const asksSlots = intents.availability(t)

    // Recordar lo que el usuario ya dijo.
    if (when.date) {
      mem.date = when.date
      mem.range = undefined
    }
    if (when.range) {
      mem.range = when.range
      mem.date = undefined
    }
    if (when.partOfDay) mem.partOfDay = when.partOfDay

    // 1) "Sí" a una oferta previa → buscar horarios.
    if (intents.affirm(t) && mem.pendingOffer === 'search_slots' && mem.serviceId && !services.length) {
      mem.pendingOffer = undefined
      return this.search(mem)
    }
    if (intents.negate(t) && mem.pendingOffer) {
      mem.pendingOffer = undefined
      return { text: '¡Perfecto! Si necesitás algo más, acá estoy.', suggestions: DEFAULT_SUGGESTIONS }
    }

    // 2) Cancelar / reprogramar: se deriva a una persona.
    if (intents.cancel(t)) {
      const policy = getBusinessInfo().policies.find((p) => p.id === 'cancelacion')!
      return {
        text: `${policy.text} Por ahora las cancelaciones y cambios las gestiona el equipo para que no se pierda ningún turno.`,
        actions: [{ type: 'whatsapp', label: 'Escribir por WhatsApp', message: 'Hola, necesito cancelar/reprogramar mi turno.' }],
      }
    }

    // 3) Políticas, dirección y horarios de atención.
    const policy = findPolicy(t)
    if (policy && !services.length) return { text: `${policy.title}: ${policy.text}`, suggestions: DEFAULT_SUGGESTIONS }
    if (intents.address(t) && !services.length) {
      const b = getBusinessInfo()
      return {
        text: `Estamos en ${b.address}, ${b.city}. Atendemos de lunes a viernes de 09:00 a 20:00 y los sábados de 09:00 a 18:00.`,
        suggestions: ['Quiero sacar turno', '¿Qué servicios tienen?'],
      }
    }
    if (intents.openingHours(t) && !services.length) {
      const b = getBusinessInfo()
      const lines = ([1, 2, 3, 4, 5, 6, 0] as const).map((d) => {
        const h = b.hours[d]
        return h ? `${WEEKDAY_NAMES[d]}: ${h.start} a ${h.end}` : `${WEEKDAY_NAMES[d]}: cerrado`
      })
      return {
        text: `Nuestros horarios de atención son:\n${lines.join('\n')}\n\nSi me decís qué servicio te interesa, te busco horarios libres.`,
        suggestions: ['¿Qué horarios tienen mañana?'],
      }
    }

    // 4) Mencionó un servicio.
    if (services.length) {
      const main = services[0]
      mem.serviceId = main.id
      if (pro && main.professionals.includes(pro.name)) mem.professionalId = pro.id
      else mem.professionalId = undefined

      if (asksSlots || when.date) {
        mem.pendingOffer = undefined
        return this.search(mem)
      }

      mem.pendingOffer = 'search_slots'
      const offer = {
        type: 'search_slots' as const,
        label: 'Buscar horarios',
        serviceId: main.id,
        professionalId: mem.professionalId,
      }
      const period = mem.range ? ` ${mem.range.label}` : ''

      if (intents.price(t) || intents.duration(t)) {
        const detail = services
          .slice(0, 2)
          .map((s) => `${s.name}: ${formatPrice(s.price)}, dura ${formatDuration(s.durationMin)}`)
          .join('.\n')
        return {
          text: `${detail}.\n\n${main.name} lo realiza${main.professionals.length > 1 ? 'n' : ''} ${joinNames(main.professionals)}. ¿Querés que te busque horarios${period}?`,
          actions: [offer],
          suggestions: ['Sí, buscá horarios'],
        }
      }

      if (intents.recommend(t) && services.length > 1) {
        const top = services.slice(0, 3)
        return {
          text: `¡Qué lindo plan! Para eso te recomiendo:\n${top.map((s) => `• ${serviceLine(s.id)}`).join('\n')}\n\nSi querés, te busco horarios${period} para ${main.name}, o tocá otro servicio.`,
          widgets: [{ type: 'services', serviceIds: top.map((s) => s.id) }],
          actions: [offer],
        }
      }

      const others = services.slice(1, 3)
      return {
        text: `Tenemos ${main.name.toLowerCase()} de ${formatDuration(main.durationMin)} por ${formatPrice(main.price)}. ${main.description}${
          others.length ? `\nTambién te puede interesar: ${others.map((s) => serviceLine(s.id)).join(', ')}.` : ''
        }\n\n¿Querés que busque horarios${period}?`,
        widgets: others.length ? [{ type: 'services', serviceIds: [main.id, ...others.map((s) => s.id)] }] : undefined,
        actions: [offer],
        suggestions: ['Sí', 'No, gracias'],
      }
    }

    // 5) Pide horarios sin nombrar servicio: usar el de la conversación o preguntar.
    if (asksSlots || when.date || when.range) {
      if (pro && pro.services.length === 1) {
        mem.serviceId = listServices().find((s) => s.name === pro.services[0])?.id
        mem.professionalId = pro.id
      }
      if (mem.serviceId && !intents.services(t)) return this.search(mem)
      if (pro) mem.professionalId = pro.id
      const available = listServices().filter((s) => !pro || s.professionals.includes(pro.name))
      return {
        text: '¡Dale! ¿Para qué servicio buscás turno? Elegí uno y te muestro los horarios libres.',
        widgets: [{ type: 'services', serviceIds: available.map((s) => s.id) }],
      }
    }

    // 6) Recomendaciones sin datos suficientes.
    if (intents.recommend(t)) {
      return {
        text: '¡Con gusto te ayudo! Contame un poco más: ¿buscás algo para el pelo, las manos o el rostro? ¿Es para una ocasión especial o para cuidarte?',
        suggestions: ['Algo para el pelo para una fiesta', 'Quiero cuidar mi piel', 'Me quiero hacer las uñas'],
      }
    }

    // 7) Precios / servicios en general.
    if (intents.price(t) || intents.services(t) || intents.duration(t)) {
      const list = listServices()
      return {
        text: `Estos son nuestros servicios (precios de referencia):\n${list.map((s) => `• ${serviceLine(s.id)}`).join('\n')}`,
        widgets: [{ type: 'services', serviceIds: list.map((s) => s.id) }],
      }
    }

    // 8) Equipo.
    if (pro) {
      return {
        text: `${pro.name} es ${pro.role.toLowerCase()}. ${pro.bio} Realiza: ${joinNames(pro.services)}.`,
        widgets: [{ type: 'professionals', professionalIds: [pro.id] }],
        suggestions: [`¿Qué horarios tiene ${pro.name}?`],
      }
    }
    if (intents.team(t)) {
      const team = listProfessionals()
      return {
        text: `Nuestro equipo:\n${team.map((p) => `• ${p.name}: ${p.role}`).join('\n')}`,
        widgets: [{ type: 'professionals', professionalIds: team.map((p) => p.id) }],
      }
    }

    if (intents.contact(t)) {
      return {
        text: 'Podés hablar con el equipo por WhatsApp, te responden en el horario de atención.',
        actions: [{ type: 'whatsapp', label: 'Abrir WhatsApp', message: 'Hola, tengo una consulta.' }],
      }
    }
    if (intents.thanks(t)) return { text: '¡De nada! Que tengas un lindo día 💛', suggestions: DEFAULT_SUGGESTIONS }
    if (intents.greeting(t)) {
      return { text: '¡Hola! ¿En qué te puedo ayudar? Puedo recomendarte un servicio, contarte precios o buscarte un horario.', suggestions: DEFAULT_SUGGESTIONS }
    }

    // 9) Sin información: no inventar.
    return {
      text: 'Mmm, sobre eso no tengo información y prefiero no inventarte nada. Puedo ayudarte con servicios, precios, profesionales y horarios disponibles, o podés consultarle al equipo por WhatsApp.',
      actions: [{ type: 'whatsapp', label: 'Consultar por WhatsApp', message: `Hola, tengo una consulta: ${message}` }],
      suggestions: DEFAULT_SUGGESTIONS,
    }
  }

  private search(mem: AIContext['memory']): AIResponse {
    const pro = mem.professionalId ?? ANY_PROFESSIONAL
    if (mem.date) return slotsResponse(mem.serviceId!, pro, mem.date, mem.partOfDay)
    return daysResponse(mem.serviceId!, pro, mem.range)
  }
}
