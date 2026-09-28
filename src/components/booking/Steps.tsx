import { CalendarX2, Check, ChevronLeft, ChevronRight, Clock, Loader2, Moon, Sun, Sunset, Users } from 'lucide-react'
import { useMemo, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { business } from '../../data/business'
import type { Professional, Service } from '../../domain/types'
import { addDays, formatDuration, formatLongDate, parseISODate, startOfWeek, timeToMin, todayISO } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { LIMITS } from '../../lib/sanitize'
import type { DayAvailability, SlotOption } from '../../services/availability'
import { ANY_PROFESSIONAL, queryDay, queryRange } from '../../services/bookingService'
import { useAppData } from '../../services/store'
import { SmartImage } from '../ui/SmartImage'

export function StepTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="text-3xl font-medium sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-ink-soft">{subtitle}</p>}
    </div>
  )
}

/* ---------- Paso 1: servicio ---------- */
export function ServiceStep({ selected, onlyProfessional, onSelect }: { selected?: string; onlyProfessional?: Professional; onSelect: (s: Service) => void }) {
  const { services } = useAppData()
  const list = services.filter((s) => s.active && (!onlyProfessional || s.professionalIds.includes(onlyProfessional.id)))
  return (
    <>
      <StepTitle title="¿Qué te gustaría hacerte?" subtitle={onlyProfessional ? `Servicios que realiza ${onlyProfessional.name}` : 'Elegí un servicio para ver los horarios disponibles.'} />
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={cx(
              'group flex items-center gap-4 rounded-3xl border bg-white p-3 pr-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft',
              selected === s.id ? 'border-ink ring-2 ring-ink' : 'border-line',
            )}
          >
            <SmartImage src={s.image} alt={s.name} className="size-20 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{s.name}</p>
              <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.description}</p>
              <p className="mt-1.5 text-sm">
                <span className="text-muted">{formatDuration(s.durationMin)}</span>
                <span className="mx-1.5 text-line">|</span>
                <span className="font-semibold">{formatPrice(s.price)}</span>
              </p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" />
          </button>
        ))}
      </div>
    </>
  )
}

/* ---------- Paso 2: profesional ---------- */
export function ProfessionalStep({ service, selected, onSelect }: { service: Service; selected?: string; onSelect: (id: string) => void }) {
  const { professionals } = useAppData()
  const eligible = professionals.filter((p) => p.active && service.professionalIds.includes(p.id))
  const options = [
    ...(eligible.length > 1 ? [{ id: ANY_PROFESSIONAL, name: 'Sin preferencia', role: 'Te asignamos el primer horario disponible', photo: '' }] : []),
    ...eligible,
  ]
  return (
    <>
      <StepTitle title="¿Con quién?" subtitle={`Profesionales que realizan ${service.name}.`} />
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((p) => (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className={cx(
              'flex items-center gap-4 rounded-3xl border bg-white p-3 pr-5 text-left transition hover:-translate-y-0.5 hover:shadow-soft',
              selected === p.id ? 'border-ink ring-2 ring-ink' : 'border-line',
            )}
          >
            {p.photo ? (
              <SmartImage src={p.photo} alt={p.name} className="size-16 shrink-0 rounded-full" />
            ) : (
              <span className="grid size-16 shrink-0 place-items-center rounded-full bg-blush text-rose-deep">
                <Users className="size-6" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{p.name}</p>
              <p className="text-sm text-muted">{p.role}</p>
            </div>
            <ChevronRight className="size-5 shrink-0 text-muted" />
          </button>
        ))}
      </div>
      {eligible.length === 0 && <EmptyState title="Sin profesionales disponibles" text="Por el momento nadie realiza este servicio." />}
    </>
  )
}

/* ---------- Paso 3: fecha ---------- */
const WEEK_HEAD = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

export function DateStep({ service, professionalId, selected, onSelect }: { service: Service; professionalId: string; selected?: string; onSelect: (d: string) => void }) {
  const data = useAppData()
  const today = todayISO()
  const days = useMemo(
    () => queryRange(service.id, professionalId, today, business.bookingWindowDays + 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, service.id, professionalId, today],
  )
  const byDate = new Map(days.map((d) => [d.date, d]))
  const first = startOfWeek(today)
  const last = days[days.length - 1].date
  const cells: string[] = []
  for (let d = first; d <= last || cells.length % 7 !== 0; d = addDays(d, 1)) cells.push(d)

  const monthLabel = [...new Set([today, last].map((d) => parseISODate(d).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })))].join(' – ')

  return (
    <>
      <StepTitle title="Elegí el día" subtitle={<span className="capitalize">{monthLabel}</span>} />
      <div className="card p-4 sm:p-6">
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold text-muted sm:gap-2">
          {WEEK_HEAD.map((w) => (
            <div key={w} className="pb-2">
              {w}
            </div>
          ))}
          {cells.map((date) => {
            const day = byDate.get(date)
            const num = parseISODate(date).getDate()
            if (!day) return <div key={date} className="aspect-square rounded-2xl text-muted/30 grid place-items-center text-sm">{num}</div>
            const ok = day.availableCount > 0
            const isSel = selected === date
            return (
              <button
                key={date}
                disabled={!ok}
                onClick={() => onSelect(date)}
                title={ok ? `${day.availableCount} horarios libres` : day.reasonLabel}
                className={cx(
                  'relative flex aspect-square flex-col items-center justify-center rounded-2xl text-sm transition',
                  isSel ? 'bg-ink text-ivory' : ok ? 'bg-sand/70 text-ink hover:bg-blush' : 'text-muted/50',
                  date === today && !isSel && 'ring-1 ring-rose/50',
                )}
              >
                <span className="text-base font-semibold sm:text-lg">{num}</span>
                {ok ? (
                  <span className={cx('text-[10px] font-medium', isSel ? 'text-ivory/80' : day.availableCount <= 3 ? 'text-[#a0671a]' : 'text-sage')}>
                    <span className="hidden sm:inline">{day.availableCount} libres</span>
                    <span className="sm:hidden">●</span>
                  </span>
                ) : (
                  <span className="hidden text-[10px] sm:inline">{day.reason === 'full' ? 'Completo' : day.reason === 'past' ? '' : 'Cerrado'}</span>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-line pt-4 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-sage" /> Con lugar</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-[#a0671a]" /> Últimos lugares</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-line" /> Completo / cerrado</span>
        </div>
      </div>
    </>
  )
}

/* ---------- Paso 4: horario ---------- */
const GROUPS = [
  { label: 'Mañana', icon: Sun, test: (m: number) => m < 13 * 60 },
  { label: 'Tarde', icon: Sunset, test: (m: number) => m >= 13 * 60 && m < 17 * 60 },
  { label: 'Últimas horas', icon: Moon, test: (m: number) => m >= 17 * 60 },
]

export function TimeStep({
  service,
  professionalId,
  date,
  selected,
  onSelect,
  onChangeDate,
}: {
  service: Service
  professionalId: string
  date: string
  selected?: string
  onSelect: (slot: SlotOption) => void
  onChangeDate: (d: string) => void
}) {
  const data = useAppData()
  const day: DayAvailability = useMemo(
    () => queryDay(service.id, professionalId, date),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, service.id, professionalId, date],
  )
  const pros = data.professionals
  const [loading, setLoading] = useState(false)

  const jump = (dir: 1 | -1) => {
    const range = queryRange(service.id, professionalId, dir === 1 ? addDays(date, 1) : todayISO(), business.bookingWindowDays)
    const candidates = range.filter((d) => d.availableCount > 0 && (dir === 1 ? d.date > date : d.date < date))
    const target = dir === 1 ? candidates[0] : candidates[candidates.length - 1]
    if (!target) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onChangeDate(target.date)
    }, 250)
  }

  return (
    <>
      <StepTitle
        title="Elegí el horario"
        subtitle={
          <span>
            {formatLongDate(date)} · {service.name} ({formatDuration(service.durationMin)})
          </span>
        }
      />
      <div className="mb-4 flex items-center justify-between gap-2">
        <button onClick={() => jump(-1)} className="btn-ghost !px-3.5 !py-2" disabled={date <= todayISO()}>
          <ChevronLeft className="size-4" /> Día anterior
        </button>
        <button onClick={() => jump(1)} className="btn-ghost !px-3.5 !py-2">
          Día siguiente <ChevronRight className="size-4" />
        </button>
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center text-muted">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : day.availableCount === 0 ? (
        <EmptyState icon={<CalendarX2 className="size-6" />} title="No quedan horarios este día" text={day.reasonLabel ?? 'Probá con otra fecha.'}>
          <button onClick={() => jump(1)} className="btn-primary mt-4">
            Ver próximo día con lugar
          </button>
        </EmptyState>
      ) : (
        <div className="space-y-6">
          {GROUPS.map((g) => {
            const slots = day.slots.filter((s) => g.test(timeToMin(s.time)))
            if (!slots.length) return null
            return (
              <div key={g.label}>
                <h3 className="mb-3 flex items-center gap-2 font-sans text-sm font-semibold text-ink-soft">
                  <g.icon className="size-4" /> {g.label}
                </h3>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {slots.map((s) => {
                    const isSel = selected === s.time
                    const proName = professionalId === ANY_PROFESSIONAL && s.available ? pros.find((p) => p.id === s.professionalIds[0])?.name : null
                    return (
                      <button
                        key={s.time}
                        disabled={!s.available}
                        onClick={() => onSelect(s)}
                        aria-label={s.available ? `Reservar a las ${s.time}` : `${s.time} ocupado`}
                        className={cx(
                          'rounded-2xl border px-2 py-3 text-center transition',
                          isSel
                            ? 'border-ink bg-ink text-ivory'
                            : s.available
                              ? 'border-line bg-white hover:-translate-y-0.5 hover:border-ink hover:shadow-soft'
                              : 'border-transparent bg-sand/50 text-muted/60',
                        )}
                      >
                        <span className={cx('block font-semibold', !s.available && 'line-through')}>{s.time}</span>
                        <span className="block text-[11px] opacity-70">{s.available ? proName ?? 'Libre' : 'Ocupado'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
          <p className="flex items-center gap-2 text-xs text-muted">
            <Clock className="size-3.5" /> Mostramos sólo horarios en los que {service.name.toLowerCase()} ({formatDuration(service.durationMin)}) entra completo.
          </p>
        </div>
      )}
    </>
  )
}

/* ---------- Paso 5: datos ---------- */
export interface ClientForm {
  firstName: string
  lastName: string
  phone: string
  email: string
  comment: string
}

export function validateForm(f: ClientForm) {
  const errors: Partial<Record<keyof ClientForm, string>> = {}
  if (f.firstName.trim().length < 2) errors.firstName = 'Ingresá tu nombre'
  if (f.lastName.trim().length < 2) errors.lastName = 'Ingresá tu apellido'
  if (f.phone.replace(/\D/g, '').length < 8) errors.phone = 'Ingresá un teléfono válido'
  if (f.email && !/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'El email no parece válido'
  return errors
}

export function DetailsStep({ form, setForm, errors, onSubmit }: { form: ClientForm; setForm: (f: ClientForm) => void; errors: Partial<Record<keyof ClientForm, string>>; onSubmit: () => void }) {
  const field = (key: keyof ClientForm, label: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={key} className="label">
        {label}
      </label>
      <input id={key} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className={cx('input', errors[key] && '!border-rose-deep')} {...props} />
      {errors[key] && <p className="mt-1 text-xs text-rose-deep">{errors[key]}</p>}
    </div>
  )
  return (
    <>
      <StepTitle title="Tus datos" subtitle="Sólo lo necesario para confirmar tu turno." />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        className="card space-y-4 p-5 sm:p-7"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {field('firstName', 'Nombre', { autoComplete: 'given-name', placeholder: 'María', maxLength: LIMITS.name })}
          {field('lastName', 'Apellido', { autoComplete: 'family-name', placeholder: 'González', maxLength: LIMITS.name })}
        </div>
        {field('phone', 'Teléfono (WhatsApp)', { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '351 555 0142', maxLength: LIMITS.phone })}
        {field('email', 'Email (opcional)', { type: 'email', autoComplete: 'email', placeholder: 'maria@mail.com', maxLength: LIMITS.email })}
        <div>
          <label htmlFor="comment" className="label">
            Comentario (opcional)
          </label>
          <textarea
            id="comment"
            rows={2}
            maxLength={LIMITS.comment}
            value={form.comment}
            onChange={(e) => setForm({ ...form, comment: e.target.value })}
            className="input resize-none"
            placeholder="Ej.: es para un evento, tengo el pelo largo…"
          />
        </div>
        <button type="submit" className="btn-primary w-full !py-4">
          Revisar y confirmar <ChevronRight className="size-4" />
        </button>
      </form>
    </>
  )
}

/* ---------- Paso 6: confirmar ---------- */
export function ConfirmStep({
  service,
  professional,
  date,
  time,
  form,
  submitting,
  onConfirm,
  onEdit,
}: {
  service: Service
  professional?: Professional
  date: string
  time: string
  form: ClientForm
  submitting: boolean
  onConfirm: () => void
  onEdit: (step: number) => void
}) {
  const rows: [string, string, number][] = [
    ['Servicio', service.name, 0],
    ['Duración', formatDuration(service.durationMin), 0],
    ['Profesional', professional?.name ?? '—', 1],
    ['Fecha', formatLongDate(date), 2],
    ['Horario', `${time} hs`, 3],
    ['Cliente', `${form.firstName} ${form.lastName}`, 4],
    ['Teléfono', form.phone, 4],
  ]
  return (
    <>
      <StepTitle title="Revisá tu turno" subtitle="Confirmá que todo esté bien antes de reservar." />
      <div className="card overflow-hidden">
        <div className="flex items-center gap-4 border-b border-line bg-sand/50 p-5">
          <SmartImage src={service.image} alt={service.name} className="size-16 shrink-0 rounded-2xl" />
          <div className="flex-1">
            <p className="text-xl font-semibold">{service.name}</p>
            <p className="text-sm text-muted">con {professional?.name}</p>
          </div>
          <p className="text-2xl font-semibold">{formatPrice(service.price)}</p>
        </div>
        <dl className="divide-y divide-line px-5">
          {rows.map(([label, value, step]) => (
            <div key={label} className="flex items-center justify-between gap-4 py-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd className="flex items-center gap-3 text-right font-medium">
                {value}
                <button onClick={() => onEdit(step)} className="text-xs font-semibold text-rose-deep hover:underline">
                  Cambiar
                </button>
              </dd>
            </div>
          ))}
          {form.comment && (
            <div className="py-3 text-sm">
              <dt className="text-muted">Comentario</dt>
              <dd className="mt-1">{form.comment}</dd>
            </div>
          )}
        </dl>
        <div className="p-5 pt-2">
          <button onClick={onConfirm} disabled={submitting} className="btn-accent w-full !py-4 !text-[15px]">
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Verificando disponibilidad…
              </>
            ) : (
              <>
                <Check className="size-4" /> Confirmar turno
              </>
            )}
          </button>
          <p className="mt-3 text-center text-xs text-muted">Podés cancelar o reprogramar sin costo hasta 24 h antes.</p>
        </div>
      </div>
    </>
  )
}

export function EmptyState({ icon, title, text, children }: { icon?: ReactNode; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-blush text-rose-deep">{icon ?? <CalendarX2 className="size-6" />}</span>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>
      {children}
    </div>
  )
}
