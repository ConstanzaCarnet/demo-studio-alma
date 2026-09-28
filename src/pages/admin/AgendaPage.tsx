import { CalendarX2, ChevronLeft, ChevronRight, LayoutGrid, List, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppointmentSheet } from '../../components/admin/AppointmentSheet'
import { PageHeader } from '../../components/admin/PageHeader'
import { SmartImage } from '../../components/ui/SmartImage'
import { STATUS_STYLE, StatusBadge } from '../../components/ui/StatusBadge'
import type { Appointment, AppointmentStatus, Professional } from '../../domain/types'
import { addDays, formatLongDate, formatShortDay, minToTime, nowMinutes, startOfWeek, timeToMin, todayISO } from '../../lib/dates'
import { cx } from '../../lib/format'
import { workingWindow } from '../../services/availability'
import { STATUS_LABEL, byTime } from '../../services/stats'
import { useAppData } from '../../services/store'

const DAY_START = 9 * 60
const DAY_END = 20 * 60
const PX = 1.25 // píxeles por minuto

type View = 'day' | 'week'

export default function AgendaPage() {
  const data = useAppData()
  const [params, setParams] = useSearchParams()
  const today = todayISO()
  const date = params.get('fecha') ?? today
  const highlight = params.get('turno')
  const [view, setView] = useState<View>('day')
  const [list, setList] = useState(() => window.innerWidth < 768)
  const [proFilter, setProFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const setDate = (d: string) => setParams((p) => (p.set('fecha', d), p.delete('turno'), p), { replace: true })
  const step = view === 'day' ? 1 : 7

  const pros = data.professionals.filter((p) => proFilter === 'all' || p.id === proFilter)
  const filtered = useMemo(
    () =>
      data.appointments.filter(
        (a) => (proFilter === 'all' || a.professionalId === proFilter) && (statusFilter === 'all' || a.status === statusFilter),
      ),
    [data.appointments, proFilter, statusFilter],
  )
  const dayList = filtered.filter((a) => a.date === date).sort(byTime)
  const weekStart = startOfWeek(date)
  const title =
    view === 'day'
      ? formatLongDate(date)
      : `${formatShortDay(weekStart).day} ${formatShortDay(weekStart).month} – ${formatShortDay(addDays(weekStart, 5)).day} ${formatShortDay(addDays(weekStart, 5)).month}`

  return (
    <>
      <PageHeader
        title="Agenda"
        subtitle={`${dayList.filter((a) => a.status !== 'cancelled').length} turnos activos ${date === today ? 'hoy' : 'este día'}`}
        actions={
          <div className="flex rounded-full border border-line bg-white p-1">
            {(['day', 'week'] as View[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cx('rounded-full px-4 py-1.5 text-sm font-medium transition', view === v ? 'bg-ink text-ivory' : 'text-ink-soft hover:text-ink')}
              >
                {v === 'day' ? 'Día' : 'Semana'}
              </button>
            ))}
          </div>
        }
      />

      {/* Barra de navegación y filtros */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setDate(addDays(date, -step))} className="grid size-10 place-items-center rounded-full border border-line bg-white hover:border-ink/30" aria-label="Anterior">
            <ChevronLeft className="size-4" />
          </button>
          <button onClick={() => setDate(today)} className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/30">
            Hoy
          </button>
          <button onClick={() => setDate(addDays(date, step))} className="grid size-10 place-items-center rounded-full border border-line bg-white hover:border-ink/30" aria-label="Siguiente">
            <ChevronRight className="size-4" />
          </button>
          <p className="ml-2 font-display text-2xl font-semibold capitalize">{title}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select value={proFilter} onChange={(e) => setProFilter(e.target.value)} className="rounded-full border border-line bg-white px-4 py-2 text-sm">
            <option value="all">Todas las profesionales</option>
            {data.professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as AppointmentStatus | 'all')} className="rounded-full border border-line bg-white px-4 py-2 text-sm">
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          {view === 'day' && (
            <button
              onClick={() => setList(!list)}
              className="flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium hover:border-ink/30"
            >
              {list ? <LayoutGrid className="size-4" /> : <List className="size-4" />}
              {list ? 'Grilla' : 'Lista'}
            </button>
          )}
        </div>
      </div>

      <Legend />

      {view === 'day' ? (
        list ? (
          <DayList items={dayList} highlight={highlight} onOpen={setOpenId} />
        ) : (
          <DayGrid date={date} pros={pros} items={dayList} highlight={highlight} onOpen={setOpenId} />
        )
      ) : (
        <WeekView weekStart={weekStart} items={filtered} highlight={highlight} onOpen={setOpenId} onPickDay={(d) => (setDate(d), setView('day'))} />
      )}

      <AppointmentSheet appointmentId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function Legend() {
  return (
    <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
      {(Object.keys(STATUS_LABEL) as AppointmentStatus[]).map((s) => (
        <span key={s} className="flex items-center gap-1.5">
          <span className={cx('size-2.5 rounded-full', STATUS_STYLE[s].dot)} /> {STATUS_LABEL[s]}
        </span>
      ))}
    </div>
  )
}

function useLookup() {
  const { clients, services, professionals } = useAppData()
  return (a: Appointment) => ({
    client: clients.find((c) => c.id === a.clientId),
    service: services.find((s) => s.id === a.serviceId),
    pro: professionals.find((p) => p.id === a.professionalId),
  })
}

function DayGrid({ date, pros, items, highlight, onOpen }: { date: string; pros: Professional[]; items: Appointment[]; highlight: string | null; onOpen: (id: string) => void }) {
  const lookup = useLookup()
  const scroller = useRef<HTMLDivElement>(null)
  const isToday = date === todayISO()
  const now = nowMinutes()
  const hours = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => DAY_START + i * 60)
  const height = (DAY_END - DAY_START) * PX

  useEffect(() => {
    const el = highlight ? document.getElementById(`apt-${highlight}`) : null
    el?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }, [highlight])

  return (
    <div ref={scroller} className="card overflow-x-auto">
      <div className="flex min-w-fit">
        {/* Columna de horas */}
        <div className="sticky left-0 z-10 w-16 shrink-0 border-r border-line bg-white">
          <div className="h-16 border-b border-line" />
          <div className="relative" style={{ height }}>
            {hours.map((m) => (
              <span key={m} className="absolute right-2 -translate-y-1/2 text-xs text-muted" style={{ top: (m - DAY_START) * PX }}>
                {minToTime(m)}
              </span>
            ))}
          </div>
        </div>

        {pros.map((p) => {
          const w = workingWindow(p, date)
          const own = items.filter((a) => a.professionalId === p.id)
          return (
            <div key={p.id} className="w-[200px] shrink-0 border-r border-line last:border-r-0 xl:flex-1">
              <div className="flex h-16 items-center gap-2.5 border-b border-line px-3">
                <SmartImage src={p.photo} alt={p.name} className="size-9 shrink-0 rounded-full" />
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted">{w ? `${w.start} – ${w.end}` : 'No trabaja'}</p>
                </div>
              </div>
              <div className="relative" style={{ height }}>
                {hours.map((m) => (
                  <div key={m} className="absolute inset-x-0 border-t border-line/70" style={{ top: (m - DAY_START) * PX }} />
                ))}
                {/* Fuera de horario y descansos */}
                {!w ? (
                  <Hatch top={0} height={height} label="No trabaja" />
                ) : (
                  <>
                    <Hatch top={0} height={(timeToMin(w.start) - DAY_START) * PX} />
                    <Hatch top={(timeToMin(w.end) - DAY_START) * PX} height={(DAY_END - timeToMin(w.end)) * PX} />
                    {w.breaks.map((b) => (
                      <Hatch key={b.start} top={(timeToMin(b.start) - DAY_START) * PX} height={(timeToMin(b.end) - timeToMin(b.start)) * PX} label="Descanso" />
                    ))}
                  </>
                )}
                {own.map((a) => {
                  const { client, service } = lookup(a)
                  const top = (timeToMin(a.start) - DAY_START) * PX
                  const h = a.durationMin * PX
                  return (
                    <button
                      id={`apt-${a.id}`}
                      key={a.id}
                      onClick={() => onOpen(a.id)}
                      className={cx(
                        'absolute inset-x-1.5 overflow-hidden rounded-xl border-l-4 px-2.5 py-1.5 text-left text-xs shadow-sm transition hover:z-10 hover:shadow-lift',
                        STATUS_STYLE[a.status].block,
                        highlight === a.id && 'z-10 ring-2 ring-rose ring-offset-2',
                      )}
                      style={{ top: top + 1, height: h - 2 }}
                    >
                      <p className={cx('font-semibold', a.status === 'cancelled' && 'line-through')}>
                        {a.start} · {client?.firstName} {client?.lastName}
                      </p>
                      {h > 40 && <p className="truncate text-ink-soft">{service?.name}</p>}
                      {h > 64 && <p className="mt-0.5 text-[11px] text-muted">{STATUS_LABEL[a.status]}</p>}
                      {a.source !== 'seed' && (
                        <span className="absolute top-1.5 right-1.5 rounded-full bg-rose px-1.5 py-0.5 text-[9px] font-bold tracking-wide text-white uppercase">
                          {a.source === 'assistant' ? <Sparkles className="inline size-2.5" /> : null} Online
                        </span>
                      )}
                    </button>
                  )
                })}
                {isToday && now > DAY_START && now < DAY_END && (
                  <div className="pointer-events-none absolute inset-x-0 z-20 border-t-2 border-rose-deep" style={{ top: (now - DAY_START) * PX }}>
                    <span className="absolute -top-[5px] -left-1 size-2 rounded-full bg-rose-deep" />
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Hatch({ top, height, label }: { top: number; height: number; label?: string }) {
  if (height <= 0) return null
  return (
    <div
      className="absolute inset-x-0 flex items-center justify-center text-[11px] text-muted"
      style={{ top, height, background: 'repeating-linear-gradient(135deg, #f5eee6 0 6px, #fbf8f4 6px 12px)' }}
    >
      {label}
    </div>
  )
}

function DayList({ items, highlight, onOpen }: { items: Appointment[]; highlight: string | null; onOpen: (id: string) => void }) {
  const lookup = useLookup()
  if (!items.length) return <EmptyAgenda />
  return (
    <ul className="space-y-2.5">
      {items.map((a) => {
        const { client, service, pro } = lookup(a)
        return (
          <li key={a.id}>
            <button
              id={`apt-${a.id}`}
              onClick={() => onOpen(a.id)}
              className={cx(
                'flex w-full items-center gap-4 rounded-2xl border-l-4 bg-white p-4 text-left shadow-soft transition hover:shadow-lift',
                STATUS_STYLE[a.status].block.replace(/bg-\S+/, ''),
                highlight === a.id && 'ring-2 ring-rose',
              )}
            >
              <div className="w-14 shrink-0">
                <p className="text-lg font-semibold">{a.start}</p>
                <p className="text-xs text-muted">{a.durationMin} min</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className={cx('truncate font-semibold', a.status === 'cancelled' && 'line-through')}>
                  {client?.firstName} {client?.lastName}
                  {a.source !== 'seed' && <span className="ml-2 rounded-full bg-rose px-1.5 py-0.5 align-middle text-[9px] font-bold text-white uppercase">Online</span>}
                </p>
                <p className="truncate text-sm text-muted">
                  {service?.name} · {pro?.name}
                </p>
              </div>
              <StatusBadge status={a.status} />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function WeekView({
  weekStart,
  items,
  highlight,
  onOpen,
  onPickDay,
}: {
  weekStart: string
  items: Appointment[]
  highlight: string | null
  onOpen: (id: string) => void
  onPickDay: (d: string) => void
}) {
  const lookup = useLookup()
  const today = todayISO()
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))
  return (
    <div className="no-scrollbar -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="grid min-w-[900px] grid-cols-6 gap-3">
        {days.map((d) => {
          const list = items.filter((a) => a.date === d).sort(byTime)
          const f = formatShortDay(d)
          return (
            <div key={d} className={cx('rounded-3xl border bg-white/70 p-2.5', d === today ? 'border-rose/50' : 'border-line')}>
              <button onClick={() => onPickDay(d)} className="mb-2 flex w-full items-baseline justify-between rounded-xl px-2 py-1.5 hover:bg-sand">
                <span className={cx('font-semibold', d === today && 'text-rose-deep')}>
                  {f.weekday} {f.day}
                </span>
                <span className="text-xs text-muted">{list.filter((a) => a.status !== 'cancelled').length} turnos</span>
              </button>
              <div className="space-y-1.5">
                {list.map((a) => {
                  const { client, service, pro } = lookup(a)
                  return (
                    <button
                      key={a.id}
                      onClick={() => onOpen(a.id)}
                      className={cx('w-full rounded-xl border-l-4 px-2.5 py-2 text-left text-xs transition hover:shadow-soft', STATUS_STYLE[a.status].block, highlight === a.id && 'ring-2 ring-rose')}
                    >
                      <p className={cx('font-semibold', a.status === 'cancelled' && 'line-through')}>
                        {a.start} {client?.firstName} {client?.lastName?.charAt(0)}.
                      </p>
                      <p className="truncate text-ink-soft">
                        {service?.name} · {pro?.name}
                      </p>
                    </button>
                  )
                })}
                {!list.length && <p className="py-6 text-center text-xs text-muted">Sin turnos</p>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyAgenda() {
  return (
    <div className="card flex flex-col items-center py-16 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-blush text-rose-deep">
        <CalendarX2 className="size-6" />
      </span>
      <p className="mt-4 font-semibold">No hay turnos para mostrar</p>
      <p className="mt-1 text-sm text-muted">Probá con otro día o cambiá los filtros.</p>
    </div>
  )
}
