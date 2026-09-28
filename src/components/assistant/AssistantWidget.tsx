import { ArrowUp, CalendarSearch, ChevronRight, Sparkles, X } from 'lucide-react'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { aiService } from '../../ai/AIService'
import type { AIAction, AIContext, AIResponse, AIWidget, ConversationMemory } from '../../ai/types'
import { whatsappLink } from '../../data/business'
import { formatDuration, formatShortDay, todayISO, addDays } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { useAppData } from '../../services/store'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { SmartImage } from '../ui/SmartImage'
import { useToast } from '../ui/Toast'

interface UiMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  response?: AIResponse
}

const WELCOME: UiMessage = {
  id: 0,
  role: 'assistant',
  text: '¡Hola! Soy Alma, la asistente virtual de Studio Alma. Puedo ayudarte a elegir un servicio, consultar precios y ayudarte a encontrar un horario.',
  response: {
    text: '',
    suggestions: ['¿Cuánto cuesta un corte?', 'Tengo una fiesta el sábado y quiero arreglarme el pelo', 'Quiero hacerme las uñas esta semana', '¿Qué horarios tienen mañana?'],
  },
}

const AssistantContext = createContext<{ open: (message?: string) => void }>({ open: () => {} })
export const useAssistant = () => useContext(AssistantContext)

export function AssistantProvider({ children }: { children: ReactNode }) {
  const [isOpen, setOpen] = useState(false)
  const [queued, setQueued] = useState<string | undefined>()
  const open = useCallback((message?: string) => {
    setQueued(message)
    setOpen(true)
  }, [])
  return (
    <AssistantContext.Provider value={{ open }}>
      {children}
      <AssistantWidget isOpen={isOpen} setOpen={setOpen} queued={queued} clearQueued={() => setQueued(undefined)} />
    </AssistantContext.Provider>
  )
}

function AssistantWidget({
  isOpen,
  setOpen,
  queued,
  clearQueued,
}: {
  isOpen: boolean
  setOpen: (v: boolean) => void
  queued?: string
  clearQueued: () => void
}) {
  const [messages, setMessages] = useState<UiMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const [teaser, setTeaser] = useState(false)
  const memory = useRef<ConversationMemory>({})
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const toast = useToast()
  useAppData() // re-render si cambian servicios/disponibilidad

  const context = (): AIContext => ({
    history: messages.map((m) => ({ role: m.role, text: m.text })),
    memory: memory.current,
    now: new Date(),
  })

  const addAssistant = (response: AIResponse) =>
    setMessages((ms) => [...ms, { id: Date.now() + 1, role: 'assistant', text: response.text, response }])
  const addUser = (text: string) => setMessages((ms) => [...ms, { id: Date.now(), role: 'user', text }])

  const send = async (text: string) => {
    const msg = text.trim()
    if (!msg || thinking) return
    setInput('')
    addUser(msg)
    setThinking(true)
    const response = await aiService.ask(msg, context())
    setThinking(false)
    addAssistant(response)
  }

  const quick = async (label: string, run: () => AIResponse) => {
    addUser(label)
    setThinking(true)
    await new Promise((r) => setTimeout(r, 350))
    setThinking(false)
    addAssistant(run())
  }

  const goToBooking = (a: { serviceId?: string; professionalId?: string; date?: string; time?: string }) => {
    const qs = new URLSearchParams()
    if (a.serviceId) qs.set('servicio', a.serviceId)
    if (a.professionalId) qs.set('profesional', a.professionalId)
    if (a.date) qs.set('fecha', a.date)
    if (a.time) qs.set('hora', a.time)
    qs.set('origen', 'asistente')
    navigate(`/reservar?${qs}`)
    if (window.innerWidth < 640) setOpen(false)
    if (a.time) toast({ kind: 'info', title: 'Horario seleccionado', description: 'Completá tus datos para confirmar el turno.' })
  }

  const runAction = (action: AIAction) => {
    if (action.type === 'whatsapp') window.open(whatsappLink(action.message), '_blank', 'noopener')
    else if (action.type === 'open_booking') goToBooking(action)
    else {
      memory.current.professionalId = action.professionalId
      quick(action.label, () => aiService.selectService(action.serviceId, context()))
    }
  }

  useEffect(() => {
    if (isOpen && queued) {
      send(queued)
      clearQueued()
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 200)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, queued])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  useEffect(() => {
    if (pathname !== '/') return
    const t = setTimeout(() => setTeaser(true), 5000)
    return () => clearTimeout(t)
  }, [pathname])

  const last = messages[messages.length - 1]

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-3 pb-[env(safe-area-inset-bottom)] sm:right-6 sm:bottom-6">
          {teaser && (
            <div className="relative max-w-[240px] animate-slide-up rounded-2xl rounded-br-md border border-line bg-white p-3.5 pr-8 text-sm shadow-lift">
              <button onClick={() => setTeaser(false)} className="absolute top-2 right-2 text-muted hover:text-ink" aria-label="Cerrar">
                <X className="size-3.5" />
              </button>
              <p className="font-semibold">¿Te ayudo a elegir? ✨</p>
              <p className="mt-0.5 text-muted">Preguntame precios, servicios u horarios libres.</p>
            </div>
          )}
          <button
            onClick={() => {
              setTeaser(false)
              setOpen(true)
            }}
            className="group relative flex h-14 items-center gap-2 rounded-full bg-ink pr-5 pl-4 text-ivory shadow-lift transition hover:-translate-y-0.5 hover:bg-ink-soft"
          >
            <span className="absolute -top-0.5 -right-0.5 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-rose opacity-60" />
              <span className="relative inline-flex size-3 rounded-full bg-rose" />
            </span>
            <Sparkles className="size-5 text-blush transition group-hover:rotate-12" />
            <span className="text-sm font-semibold">Asistente</span>
          </button>
        </div>
      )}

      {/* Panel de chat */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex animate-slide-up flex-col bg-ivory sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(680px,calc(100dvh-3rem))] sm:w-[400px] sm:rounded-3xl sm:border sm:border-line sm:shadow-lift">
          <header className="flex items-center gap-3 border-b border-line bg-white/80 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur sm:rounded-t-3xl">
            <div className="relative grid size-10 place-items-center rounded-full bg-gradient-to-br from-rose to-gold font-display text-lg text-white italic">
              A
              <span className="absolute right-0 bottom-0 size-2.5 rounded-full border-2 border-white bg-[#4f8a5c]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Alma</p>
              <p className="truncate text-xs text-muted">
                Asistente virtual · {aiService.providerName === 'demo' ? 'Modo demo' : 'IA conectada'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-full p-2 text-muted hover:bg-sand hover:text-ink" aria-label="Cerrar chat">
              <X className="size-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                isLast={m === last}
                onSuggestion={send}
                onAction={runAction}
                onService={(id, name) => quick(name, () => aiService.selectService(id, context()))}
                onDay={(serviceId, proId, date, label) => quick(label, () => aiService.selectDay(serviceId, proId, date, context()))}
                onSlot={(serviceId, proId, date, time) => goToBooking({ serviceId, professionalId: proId, date, time })}
              />
            ))}
            {thinking && (
              <div className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3.5">
                {[0, 150, 300].map((d) => (
                  <span key={d} className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="border-t border-line bg-white/80 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-3xl"
          >
            <div className="flex items-center gap-2 rounded-full border border-line bg-white py-1.5 pr-1.5 pl-4 focus-within:border-rose focus-within:ring-4 focus-within:ring-rose/10">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribí tu consulta…"
                className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted/70"
                aria-label="Mensaje para Alma"
              />
              <button
                type="submit"
                disabled={!input.trim() || thinking}
                className="grid size-9 place-items-center rounded-full bg-ink text-ivory transition hover:bg-ink-soft disabled:bg-line disabled:text-muted"
                aria-label="Enviar"
              >
                <ArrowUp className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted">Alma responde con la información real del salón y no confirma turnos sin tu aprobación.</p>
          </form>
        </div>
      )}
    </>
  )
}

function MessageBubble({
  message,
  isLast,
  onSuggestion,
  onAction,
  onService,
  onDay,
  onSlot,
}: {
  message: UiMessage
  isLast: boolean
  onSuggestion: (text: string) => void
  onAction: (a: AIAction) => void
  onService: (id: string, name: string) => void
  onDay: (serviceId: string, proId: string, date: string, label: string) => void
  onSlot: (serviceId: string, proId: string, date: string, time: string) => void
}) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto w-fit max-w-[85%] animate-fade-in rounded-2xl rounded-br-md bg-ink px-4 py-2.5 text-[15px] text-ivory">
        {message.text}
      </div>
    )
  }
  const r = message.response
  return (
    <div className="max-w-[92%] animate-fade-up space-y-2.5">
      <div className="rounded-2xl rounded-bl-md border border-line bg-white px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line">
        {message.text}
      </div>
      {r?.widgets?.map((w, i) => (
        <Widget key={i} widget={w} active={isLast} onService={onService} onDay={onDay} onSlot={onSlot} />
      ))}
      {r?.actions && isLast && (
        <div className="flex flex-wrap gap-2">
          {r.actions.map((a, i) => (
            <button
              key={i}
              onClick={() => onAction(a)}
              className={cx('btn !py-2 !text-[13px]', a.type === 'whatsapp' ? 'btn-wa' : 'btn-primary')}
            >
              {a.type === 'whatsapp' ? <WhatsAppIcon className="size-4" /> : <CalendarSearch className="size-4" />}
              {a.label}
            </button>
          ))}
        </div>
      )}
      {r?.suggestions && isLast && (
        <div className="flex flex-wrap gap-1.5">
          {r.suggestions.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="rounded-full border border-rose/30 bg-blush/40 px-3 py-1.5 text-left text-[13px] text-rose-deep transition hover:bg-blush"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Widget({
  widget,
  active,
  onService,
  onDay,
  onSlot,
}: {
  widget: AIWidget
  active: boolean
  onService: (id: string, name: string) => void
  onDay: (serviceId: string, proId: string, date: string, label: string) => void
  onSlot: (serviceId: string, proId: string, date: string, time: string) => void
}) {
  const { services, professionals } = useAppData()
  const today = todayISO()

  if (widget.type === 'services') {
    return (
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1">
        {widget.serviceIds.map((id) => {
          const s = services.find((x) => x.id === id)
          if (!s) return null
          return (
            <button
              key={id}
              onClick={() => onService(s.id, s.name)}
              className="w-40 shrink-0 snap-start overflow-hidden rounded-2xl border border-line bg-white text-left transition hover:-translate-y-0.5 hover:shadow-soft"
            >
              <SmartImage src={s.image} alt={s.name} className="h-20" />
              <div className="p-3">
                <p className="text-sm leading-tight font-semibold">{s.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {formatDuration(s.durationMin)} · {formatPrice(s.price)}
                </p>
                <p className="mt-2 flex items-center text-xs font-semibold text-rose-deep">
                  Ver horarios <ChevronRight className="size-3.5" />
                </p>
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  if (widget.type === 'professionals') {
    return (
      <div className="flex flex-wrap gap-2">
        {widget.professionalIds.map((id) => {
          const p = professionals.find((x) => x.id === id)
          if (!p) return null
          return (
            <div key={id} className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pr-3 pl-1">
              <SmartImage src={p.photo} alt={p.name} className="size-8 rounded-full" />
              <span className="text-sm font-semibold">{p.name}</span>
              <span className="text-xs text-muted">{p.role}</span>
            </div>
          )
        })}
      </div>
    )
  }

  if (widget.type === 'days') {
    return (
      <div className="grid grid-cols-3 gap-2">
        {widget.days.map((d) => {
          const f = formatShortDay(d.date)
          const rel = d.date === today ? 'Hoy' : d.date === addDays(today, 1) ? 'Mañana' : f.weekday
          return (
            <button
              key={d.date}
              disabled={!active}
              onClick={() => onDay(widget.serviceId, widget.professionalId, d.date, `${rel} ${f.day}`)}
              className="rounded-2xl border border-line bg-white px-2 py-2.5 text-center transition enabled:hover:border-rose enabled:hover:bg-blush/30 disabled:opacity-60"
            >
              <span className="block text-xs text-muted">{rel}</span>
              <span className="block font-display text-2xl leading-tight font-semibold">{f.day}</span>
              <span className="block text-[11px] text-sage">
                {d.availableCount} {d.availableCount === 1 ? 'horario' : 'horarios'}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  const pro = (id: string) => professionals.find((p) => p.id === id)?.name
  return (
    <div className="grid grid-cols-3 gap-2">
      {widget.slots.map((s) => (
        <button
          key={s.time}
          disabled={!active}
          onClick={() => onSlot(widget.serviceId, s.professionalId, widget.date, s.time)}
          className="rounded-xl border border-line bg-white px-2 py-2 text-center transition enabled:hover:border-ink enabled:hover:bg-ink enabled:hover:text-ivory disabled:opacity-60"
        >
          <span className="block text-[15px] font-semibold">{s.time}</span>
          {widget.professionalId === 'any' && <span className="block text-[11px] opacity-70">{pro(s.professionalId)}</span>}
        </button>
      ))}
    </div>
  )
}
