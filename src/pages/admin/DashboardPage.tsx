import { ArrowRight, Ban, CalendarCheck2, CalendarDays, Clock3, Globe, Sparkles, Wallet } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AppointmentSheet } from '../../components/admin/AppointmentSheet'
import { PageHeader, Panel } from '../../components/admin/PageHeader'
import { SmartImage } from '../../components/ui/SmartImage'
import { StatusBadge } from '../../components/ui/StatusBadge'
import type { Appointment } from '../../domain/types'
import { addDays, formatLongDate, formatRelativeDate, formatShortDay, minToTime, nowMinutes, startOfWeek, todayISO } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { byTime, daySummary, occupancy, topServices, weekSeries } from '../../services/stats'
import { useAppData } from '../../services/store'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
}

export default function DashboardPage() {
  const data = useAppData()
  const today = todayISO()
  const [openId, setOpenId] = useState<string | null>(null)
  const summary = daySummary(data, today)

  const upcoming = useMemo(() => {
    const nowT = minToTime(nowMinutes())
    return data.appointments
      .filter((a) => (a.date > today || (a.date === today && a.start >= nowT)) && (a.status === 'confirmed' || a.status === 'pending'))
      .sort(byTime)
      .slice(0, 6)
  }, [data, today])

  const online = useMemo(
    () => data.appointments.filter((a) => a.source === 'web' || a.source === 'assistant').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [data],
  )

  const kpis = [
    { label: 'Turnos de hoy', value: summary.total, icon: CalendarDays, tone: 'bg-sand text-ink' },
    { label: 'Confirmados', value: summary.confirmed, icon: CalendarCheck2, tone: 'bg-[#e5efe4] text-[#2e5a36]' },
    { label: 'Pendientes', value: summary.pending, icon: Clock3, tone: 'bg-[#fbf0d8] text-[#7f5310]' },
    { label: 'Cancelados', value: summary.cancelled, icon: Ban, tone: 'bg-[#f7e2df] text-[#963a31]' },
  ]

  return (
    <>
      <PageHeader
        title={`${greeting()} 👋`}
        subtitle={`Resumen de hoy · ${formatLongDate(today)}`}
        actions={
          <Link to="/admin/turnos" className="btn-primary">
            <CalendarDays className="size-4" /> Ver agenda
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        {kpis.map((k, i) => (
          <div key={k.label} className="card animate-fade-up p-4 sm:p-5" style={{ animationDelay: `${i * 50}ms` }}>
            <span className={cx('grid size-9 place-items-center rounded-xl', k.tone)}>
              <k.icon className="size-[18px]" />
            </span>
            <p className="mt-4 text-sm text-muted">{k.label}</p>
            <p className="font-display text-4xl font-semibold">{k.value}</p>
          </div>
        ))}
        <div className="card col-span-2 animate-fade-up bg-ink p-4 text-ivory sm:p-5 lg:col-span-1" style={{ animationDelay: '200ms' }}>
          <span className="grid size-9 place-items-center rounded-xl bg-ivory/10 text-blush">
            <Wallet className="size-[18px]" />
          </span>
          <p className="mt-4 text-sm text-ivory/70">Ingresos estimados</p>
          <p className="font-display text-4xl font-semibold">{formatPrice(summary.revenue)}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="Próximos turnos"
          action={
            <Link to="/admin/turnos" className="flex items-center gap-1 text-sm font-semibold text-rose-deep hover:underline">
              Ver todos <ArrowRight className="size-4" />
            </Link>
          }
        >
          {upcoming.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {upcoming.map((a) => (
                <AppointmentRow key={a.id} a={a} onClick={() => setOpenId(a.id)} />
              ))}
            </ul>
          ) : (
            <p className="py-8 text-center text-sm text-muted">No hay más turnos próximos.</p>
          )}
        </Panel>

        <Panel title="Reservas online recientes">
          {online.length ? (
            <ul className="-mx-2 divide-y divide-line">
              {online.map((a) => (
                <AppointmentRow key={a.id} a={a} onClick={() => setOpenId(a.id)} showSource />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center py-8 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-blush text-rose-deep">
                <Globe className="size-5" />
              </span>
              <p className="mt-3 font-semibold">Todavía no hay reservas online</p>
              <p className="mt-1 max-w-xs text-sm text-muted">Reservá un turno desde el sitio público y aparecerá acá al instante.</p>
              <Link to="/reservar" className="btn-ghost mt-4 !py-2 !text-[13px]">
                Probar una reserva
              </Link>
            </div>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <WeekChart />
        <OccupancyPanel />
        <TopServicesPanel />
      </div>

      <AppointmentSheet appointmentId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}

function AppointmentRow({ a, onClick, showSource }: { a: Appointment; onClick: () => void; showSource?: boolean }) {
  const { clients, services, professionals } = useAppData()
  const client = clients.find((c) => c.id === a.clientId)
  const service = services.find((s) => s.id === a.serviceId)
  const pro = professionals.find((p) => p.id === a.professionalId)
  return (
    <li>
      <button onClick={onClick} className="flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition hover:bg-sand/60">
        <div className="w-16 shrink-0 text-center">
          <p className="text-lg leading-none font-semibold">{a.start}</p>
          <p className="mt-1 truncate text-[11px] text-muted">{formatRelativeDate(a.date).split(' ').slice(0, 2).join(' ')}</p>
        </div>
        <SmartImage src={pro?.photo ?? ''} alt={pro?.name ?? ''} className="size-9 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">
            {client?.firstName} {client?.lastName}
          </p>
          <p className="truncate text-sm text-muted">
            {service?.name} · {pro?.name}
          </p>
        </div>
        {showSource && a.source === 'assistant' ? (
          <span className="flex items-center gap-1 rounded-full bg-blush px-2.5 py-1 text-xs font-semibold text-rose-deep">
            <Sparkles className="size-3.5" /> IA
          </span>
        ) : (
          <StatusBadge status={a.status} className="hidden sm:inline-flex" />
        )}
      </button>
    </li>
  )
}

/* Gráfico de barras: una sola serie (turnos por día), sin leyenda; tooltip al pasar el mouse. */
function WeekChart() {
  const data = useAppData()
  const today = todayISO()
  const series = weekSeries(data, startOfWeek(today))
  const [hover, setHover] = useState<number | null>(null)
  const max = Math.max(4, ...series.map((d) => d.count))
  const total = series.reduce((s, d) => s + d.count, 0)

  return (
    <Panel title="Turnos esta semana" action={<span className="text-sm text-muted">{total} en total</span>}>
      <div className="relative flex h-48 items-end gap-3 border-b border-line pt-6">
        {series.map((d, i) => {
          const f = formatShortDay(d.date)
          const isToday = d.date === today
          return (
            <div
              key={d.date}
              className="relative flex h-full flex-1 flex-col items-center justify-end"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => setHover(hover === i ? null : i)}
            >
              {hover === i && (
                <div className="absolute bottom-full z-10 mb-1 w-max rounded-xl bg-ink px-3 py-2 text-xs text-ivory shadow-lift">
                  <p className="font-semibold">
                    {f.weekday} {f.day}
                  </p>
                  <p>
                    {d.count} turnos · {formatPrice(d.revenue)}
                  </p>
                </div>
              )}
              {isToday && <span className="mb-1 text-xs font-semibold">{d.count}</span>}
              <div
                className={cx('w-full max-w-9 rounded-t-[4px] transition-all duration-500', hover === i ? 'bg-rose-deep' : 'bg-rose')}
                style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }}
              />
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {series.map((d) => {
          const f = formatShortDay(d.date)
          return (
            <span key={d.date} className={cx('flex-1 text-center text-xs', d.date === today ? 'font-semibold text-ink' : 'text-muted')}>
              {d.date === today ? 'Hoy' : f.weekday}
            </span>
          )
        })}
      </div>
    </Panel>
  )
}

function OccupancyPanel() {
  const data = useAppData()
  const rows = occupancy(data, todayISO())
  return (
    <Panel title="Ocupación de hoy">
      <ul className="space-y-4">
        {rows.map(({ professional: p, pct, minutes }) => (
          <li key={p.id} className="flex items-center gap-3">
            <SmartImage src={p.photo} alt={p.name} className="size-9 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-semibold">{p.name}</span>
                <span className="text-muted">{pct === null ? 'No trabaja hoy' : `${pct}%`}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
                {pct !== null && <div className="h-full rounded-full bg-sage transition-all duration-700" style={{ width: `${pct}%` }} title={`${Math.round(minutes / 60)} h reservadas`} />}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

function TopServicesPanel() {
  const data = useAppData()
  const today = todayISO()
  const all = topServices(data, addDays(today, -30), today)
  const rows = all.slice(0, 5)
  const max = rows[0]?.count ?? 1
  const total = all.reduce((s, r) => s + r.count, 0)
  return (
    <Panel title="Servicios más pedidos" action={<span className="text-sm text-muted">Últimos 30 días</span>}>
      <ul className="space-y-3.5">
        {rows.map(({ service, count }) => (
          <li key={service.id}>
            <div className="flex justify-between text-sm">
              <span className="font-medium">{service.name}</span>
              <span className="text-muted">{count}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-sand">
              <div className="h-full rounded-full bg-gold" style={{ width: `${(count / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-xs text-muted">{total} turnos atendidos en los últimos 30 días</p>
    </Panel>
  )
}
