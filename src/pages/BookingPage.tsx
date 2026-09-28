import { ArrowLeft, CalendarPlus, Check, Download, Home, LayoutDashboard, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAssistant } from '../components/assistant/AssistantWidget'
import { BookingSummary, MobileSummary } from '../components/booking/BookingSummary'
import {
  ConfirmStep,
  DateStep,
  DetailsStep,
  ProfessionalStep,
  ServiceStep,
  TimeStep,
  validateForm,
  type ClientForm,
} from '../components/booking/Steps'
import { WhatsAppIcon } from '../components/ui/BrandIcons'
import { DemoPill, Logo } from '../components/ui/Logo'
import { useToast } from '../components/ui/Toast'
import { business } from '../data/business'
import type { Appointment, Client } from '../domain/types'
import { downloadIcs, googleCalendarUrl } from '../lib/calendar'
import { formatDuration, formatLongDate } from '../lib/dates'
import { cx, formatPrice } from '../lib/format'
import { ANY_PROFESSIONAL, BookingError, createBooking, queryDay } from '../services/bookingService'
import { useAppData } from '../services/store'

const STEPS = ['Servicio', 'Profesional', 'Fecha', 'Horario', 'Datos', 'Confirmar']
const EMPTY_FORM: ClientForm = { firstName: '', lastName: '', phone: '', email: '', comment: '' }

interface Draft {
  serviceId?: string
  /** Preferencia elegida (puede ser ANY_PROFESSIONAL). */
  professionalId?: string
  /** Profesional concreto asignado al horario elegido. */
  assignedId?: string
  date?: string
  time?: string
}

/** Paso inicial según los parámetros de la URL (links desde servicios, equipo o el asistente). */
function initialState(params: URLSearchParams, services: { id: string; professionalIds: string[]; active: boolean }[]): { draft: Draft; step: number; stale: boolean } {
  const service = services.find((s) => s.id === params.get('servicio') && s.active)
  const pro = params.get('profesional') ?? undefined
  const proOk = pro && (!service || pro === ANY_PROFESSIONAL || service.professionalIds.includes(pro)) ? pro : undefined
  const date = params.get('fecha') ?? undefined
  const time = params.get('hora') ?? undefined
  if (!service) return { draft: { professionalId: proOk }, step: 0, stale: false }
  if (!proOk) return { draft: { serviceId: service.id }, step: 1, stale: false }
  if (!date) return { draft: { serviceId: service.id, professionalId: proOk }, step: 2, stale: false }
  if (time) {
    const slot = queryDay(service.id, proOk, date).slots.find((s) => s.time === time && s.available)
    if (slot) return { draft: { serviceId: service.id, professionalId: proOk, assignedId: slot.professionalIds[0], date, time }, step: 4, stale: false }
    return { draft: { serviceId: service.id, professionalId: proOk, date }, step: 3, stale: true }
  }
  return { draft: { serviceId: service.id, professionalId: proOk, date }, step: 3, stale: false }
}

export default function BookingPage() {
  const data = useAppData()
  const [params] = useSearchParams()
  const toast = useToast()
  const [init] = useState(() => initialState(params, data.services))
  const [draft, setDraft] = useState<Draft>(init.draft)
  const [step, setStep] = useState(init.step)
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<ReturnType<typeof validateForm>>({})
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ appointment: Appointment; client: Client } | null>(null)
  const fromAssistant = params.get('origen') === 'asistente'

  useEffect(() => {
    if (init.stale) toast({ kind: 'error', title: 'Ese horario ya no está disponible', description: 'Elegí otro de la lista actualizada.' })
  }, [init.stale, toast])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step, result])

  const service = data.services.find((s) => s.id === draft.serviceId)
  const assigned = data.professionals.find((p) => p.id === (draft.assignedId ?? draft.professionalId))
  const onlyPro = !draft.serviceId && draft.professionalId ? data.professionals.find((p) => p.id === draft.professionalId) : undefined

  const go = (s: number) => setStep(s)
  const canGo = (i: number) =>
    i === 0 || (i === 1 && !!service) || (i === 2 && !!draft.professionalId && !!service) || (i === 3 && !!draft.date) || (i === 4 && !!draft.time) || (i === 5 && !!draft.time && Object.keys(validateForm(form)).length === 0 && !!form.firstName)

  const confirm = async () => {
    if (!service || !draft.date || !draft.time || !draft.professionalId) return
    setSubmitting(true)
    try {
      const res = await createBooking({
        serviceId: service.id,
        professionalId: draft.assignedId ?? draft.professionalId,
        date: draft.date,
        time: draft.time,
        client: form,
        comment: form.comment,
        source: fromAssistant ? 'assistant' : 'web',
      })
      setResult(res)
    } catch (e) {
      const err = e as BookingError
      toast({ kind: 'error', title: err.code === 'SLOT_TAKEN' ? 'Ese horario se acaba de ocupar' : 'No pudimos reservar', description: err.message })
      if (err.code === 'SLOT_TAKEN') {
        setDraft((d) => ({ ...d, time: undefined, assignedId: undefined }))
        setStep(3)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-ivory">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-ivory/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Volver al sitio</span>
            <span className="sm:hidden">Salir</span>
          </Link>
        </div>
      </header>

      {result ? (
        <Confirmation appointment={result.appointment} client={result.client} />
      ) : (
        <div className="mx-auto max-w-6xl px-4 pt-6 pb-32 sm:px-6 lg:pb-16">
          {/* Stepper */}
          <ol className="no-scrollbar -mx-4 mb-8 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {STEPS.map((label, i) => {
              const done = i < step
              const enabled = canGo(i) && i !== step
              return (
                <li key={label} className="flex min-w-fit flex-1 items-center gap-1">
                  <button
                    disabled={!enabled}
                    onClick={() => go(i)}
                    className={cx('flex items-center gap-2 rounded-full py-1.5 pr-3 pl-1.5 text-sm transition', i === step ? 'bg-white shadow-soft' : enabled && 'hover:bg-white/70')}
                  >
                    <span
                      className={cx(
                        'grid size-6 place-items-center rounded-full text-xs font-semibold',
                        i === step ? 'bg-ink text-ivory' : done ? 'bg-sage text-white' : 'bg-shell text-muted',
                      )}
                    >
                      {done ? <Check className="size-3.5" /> : i + 1}
                    </span>
                    <span className={cx('font-medium', i === step ? 'text-ink' : 'text-muted', i !== step && 'hidden md:inline')}>{label}</span>
                  </button>
                  {i < STEPS.length - 1 && <span className="hidden h-px flex-1 bg-line md:block" />}
                </li>
              )
            })}
          </ol>

          <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
            <div key={step} className="min-w-0 animate-fade-up">
              {step > 0 && (
                <button onClick={() => go(step - 1)} className="mb-4 flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
                  <ArrowLeft className="size-4" /> Atrás
                </button>
              )}
              {step === 0 && (
                <ServiceStep
                  selected={draft.serviceId}
                  onlyProfessional={onlyPro}
                  onSelect={(s) => {
                    const keepPro = draft.professionalId && s.professionalIds.includes(draft.professionalId) ? draft.professionalId : undefined
                    setDraft({ serviceId: s.id, professionalId: keepPro })
                    go(keepPro ? 2 : 1)
                  }}
                />
              )}
              {step === 1 && service && (
                <ProfessionalStep
                  service={service}
                  selected={draft.professionalId}
                  onSelect={(id) => {
                    setDraft({ serviceId: service.id, professionalId: id })
                    go(2)
                  }}
                />
              )}
              {step === 2 && service && draft.professionalId && (
                <DateStep
                  service={service}
                  professionalId={draft.professionalId}
                  selected={draft.date}
                  onSelect={(date) => {
                    setDraft({ ...draft, date, time: undefined, assignedId: undefined })
                    go(3)
                  }}
                />
              )}
              {step === 3 && service && draft.professionalId && draft.date && (
                <TimeStep
                  service={service}
                  professionalId={draft.professionalId}
                  date={draft.date}
                  selected={draft.time}
                  onChangeDate={(date) => setDraft({ ...draft, date, time: undefined, assignedId: undefined })}
                  onSelect={(slot) => {
                    setDraft({ ...draft, time: slot.time, assignedId: slot.professionalIds[0] })
                    go(4)
                  }}
                />
              )}
              {step === 4 && (
                <DetailsStep
                  form={form}
                  setForm={setForm}
                  errors={errors}
                  onSubmit={() => {
                    const errs = validateForm(form)
                    setErrors(errs)
                    if (Object.keys(errs).length === 0) go(5)
                  }}
                />
              )}
              {step === 5 && service && draft.date && draft.time && (
                <ConfirmStep service={service} professional={assigned} date={draft.date} time={draft.time} form={form} submitting={submitting} onConfirm={confirm} onEdit={go} />
              )}
            </div>
            <div className="hidden lg:block">
              <BookingSummary service={service} professional={draft.assignedId || draft.professionalId !== ANY_PROFESSIONAL ? assigned : undefined} anyProfessional={draft.professionalId === ANY_PROFESSIONAL} date={draft.date} time={draft.time} />
            </div>
          </div>
        </div>
      )}

      {!result && (
        <MobileSummary service={service} professional={draft.assignedId || draft.professionalId !== ANY_PROFESSIONAL ? assigned : undefined} anyProfessional={draft.professionalId === ANY_PROFESSIONAL} date={draft.date} time={draft.time} />
      )}
    </div>
  )
}

function Confirmation({ appointment, client }: { appointment: Appointment; client: Client }) {
  const { services, professionals } = useAppData()
  const navigate = useNavigate()
  const assistant = useAssistant()
  const service = services.find((s) => s.id === appointment.serviceId)!
  const pro = professionals.find((p) => p.id === appointment.professionalId)!
  const event = {
    title: `${service.name} con ${pro.name} · ${business.name}`,
    description: `Turno en ${business.name}\nServicio: ${service.name}\nProfesional: ${pro.name}\nDuración: ${formatDuration(appointment.durationMin)}`,
    date: appointment.date,
    start: appointment.start,
    durationMin: appointment.durationMin,
  }
  const waText = `¡Hola! Te comparto mi turno en ${business.name} ✨\n\n📍 ${business.address}, ${business.city}\n💇 ${service.name} con ${pro.name}\n📅 ${formatLongDate(appointment.date)}\n🕐 ${appointment.start} hs (${formatDuration(appointment.durationMin)})`

  const rows = [
    ['Servicio', service.name],
    ['Profesional', pro.name],
    ['Fecha', formatLongDate(appointment.date)],
    ['Hora', `${appointment.start} hs`],
    ['Duración', `${appointment.durationMin} minutos`],
    ['Cliente', `${client.firstName} ${client.lastName}`],
    ['Total', formatPrice(appointment.price)],
  ]

  return (
    <div className="mx-auto max-w-lg px-4 pt-10 pb-16 sm:pt-16">
      <div className="text-center">
        <div className="relative mx-auto grid size-20 animate-pop place-items-center rounded-full bg-sage text-white shadow-lift">
          <span className="absolute inset-0 animate-ping rounded-full bg-sage/30 [animation-iteration-count:2]" />
          <Check className="size-10" strokeWidth={2.5} />
        </div>
        <h1 className="mt-6 animate-fade-up text-5xl font-medium">¡Turno confirmado!</h1>
        <p className="mt-2 animate-fade-up text-ink-soft [animation-delay:80ms]">
          Te esperamos, {client.firstName}. Guardá los datos de tu turno.
        </p>
      </div>

      <div className="card mt-8 animate-fade-up overflow-hidden [animation-delay:140ms]">
        <dl className="divide-y divide-line px-6">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-3.5 text-[15px]">
              <dt className="text-muted">{k}</dt>
              <dd className="text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="bg-sand/60 px-6 py-3 text-center text-xs text-muted">
          {business.address}, {business.city} · Código {appointment.id.slice(-6).toUpperCase()}
        </div>
      </div>

      <div className="mt-6 grid animate-fade-up gap-3 [animation-delay:200ms]">
        <a href={googleCalendarUrl(event)} target="_blank" rel="noreferrer" className="btn-primary !py-4">
          <CalendarPlus className="size-4" /> Agregar al calendario
        </a>
        <a href={`https://wa.me/?text=${encodeURIComponent(waText)}`} target="_blank" rel="noreferrer" className="btn-wa !py-4">
          <WhatsAppIcon className="size-4" /> Enviar por WhatsApp
        </a>
        <button onClick={() => navigate('/')} className="btn-ghost !py-4">
          <Home className="size-4" /> Volver al inicio
        </button>
        <button onClick={() => downloadIcs(event)} className="mx-auto flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <Download className="size-3.5" /> Descargar archivo .ics (Apple / Outlook)
        </button>
      </div>

      <div className="mt-10 rounded-3xl border border-dashed border-gold/50 bg-gold/5 p-5 text-sm">
        <p className="flex items-center gap-2 font-semibold">
          <DemoPill /> Así lo ve el negocio
        </p>
        <p className="mt-1.5 text-ink-soft">El turno ya aparece en la agenda del panel administrativo, en tiempo real.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={`/admin/turnos?fecha=${appointment.date}&turno=${appointment.id}`} className="btn-ghost !py-2 !text-[13px]">
            <LayoutDashboard className="size-4" /> Ver en el panel
          </Link>
          <button onClick={() => assistant.open('¿Qué medios de pago aceptan?')} className="btn-ghost !py-2 !text-[13px]">
            <Sparkles className="size-4" /> Preguntarle a Alma
          </button>
        </div>
      </div>
    </div>
  )
}
