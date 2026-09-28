import { Coffee } from 'lucide-react'
import { PageHeader } from '../../components/admin/PageHeader'
import { SmartImage } from '../../components/ui/SmartImage'
import { useToast } from '../../components/ui/Toast'
import type { Weekday } from '../../domain/types'
import { WEEKDAY_NAMES, todayISO, weekdayOf } from '../../lib/dates'
import { cx } from '../../lib/format'
import { setProfessionalActive } from '../../services/adminService'
import { occupancy } from '../../services/stats'
import { useAppData } from '../../services/store'
import { Toggle } from './ServicesAdminPage'

const ORDER: Weekday[] = [1, 2, 3, 4, 5, 6, 0]

/** "Lunes a sábado" / "Martes a sábado" / "Lunes, miércoles…" */
function workDaysLabel(days: Weekday[]) {
  const idx = ORDER.filter((d) => days.includes(d)).map((d) => ORDER.indexOf(d))
  const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1)
  const names = idx.map((i) => WEEKDAY_NAMES[ORDER[i]].toLowerCase())
  if (contiguous && names.length > 2) return `${names[0].charAt(0).toUpperCase() + names[0].slice(1)} a ${names[names.length - 1]}`
  return names.map((n, i) => (i === 0 ? n.charAt(0).toUpperCase() + n.slice(1) : n)).join(', ')
}

export default function ProfessionalsPage() {
  const data = useAppData()
  const toast = useToast()
  const today = todayISO()
  const occ = occupancy(data, today)

  return (
    <>
      <PageHeader title="Profesionales" subtitle="Horarios, servicios y disponibilidad del equipo." />
      <div className="grid gap-5 lg:grid-cols-2">
        {data.professionals.map((p) => {
          const days = ORDER.filter((d) => p.schedule[d])
          const services = data.services.filter((s) => s.professionalIds.includes(p.id))
          const todays = data.appointments.filter((a) => a.professionalId === p.id && a.date === today && a.status !== 'cancelled').length
          const pct = occ.find((o) => o.professional.id === p.id)?.pct
          return (
            <article key={p.id} className={cx('card p-5 sm:p-6', !p.active && 'opacity-70')}>
              <div className="flex items-start gap-4">
                <SmartImage src={p.photo} alt={p.name} className="size-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="text-3xl font-semibold">{p.name}</h2>
                  <p className="text-sm font-semibold text-rose-deep">{p.role}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Toggle
                    checked={p.active}
                    onChange={(v) => {
                      setProfessionalActive(p.id, v)
                      toast({ kind: v ? 'success' : 'info', title: v ? `${p.name} está disponible` : `${p.name} no toma turnos`, description: v ? undefined : 'Sus horarios dejan de ofrecerse online.' })
                    }}
                  />
                  <span className={cx('text-xs font-semibold', p.active ? 'text-sage' : 'text-muted')}>{p.active ? 'Activa' : 'Inactiva'}</span>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-2xl bg-sand/70 p-3">
                  <p className="text-xs text-muted">Disponible</p>
                  <p className="mt-0.5 text-sm font-semibold">{workDaysLabel(days)}</p>
                </div>
                <div className="rounded-2xl bg-sand/70 p-3">
                  <p className="text-xs text-muted">Turnos hoy</p>
                  <p className="mt-0.5 text-sm font-semibold">{p.schedule[weekdayOf(today)] ? todays : 'Libre'}</p>
                </div>
                <div className="rounded-2xl bg-sand/70 p-3">
                  <p className="text-xs text-muted">Ocupación hoy</p>
                  <p className="mt-0.5 text-sm font-semibold">{pct == null ? '—' : `${pct}%`}</p>
                </div>
              </div>

              <h3 className="mt-5 mb-2 font-sans text-sm font-semibold">Horarios</h3>
              <ul className="grid grid-cols-7 gap-1 text-center text-xs">
                {ORDER.map((d) => {
                  const s = p.schedule[d]
                  return (
                    <li key={d} className={cx('rounded-xl px-1 py-2', s ? 'bg-white ring-1 ring-line' : 'bg-sand/40 text-muted')}>
                      <p className="font-semibold">{WEEKDAY_NAMES[d].slice(0, 2)}</p>
                      {s ? (
                        <p className="mt-1 leading-tight text-ink-soft">
                          {s.start}
                          <br />
                          {s.end}
                        </p>
                      ) : (
                        <p className="mt-1 leading-tight">—</p>
                      )}
                    </li>
                  )
                })}
              </ul>
              {days[0] !== undefined && p.schedule[days[0]]?.breaks.length ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                  <Coffee className="size-3.5" /> Descanso {p.schedule[days[0]]!.breaks.map((b) => `${b.start} – ${b.end}`).join(', ')}
                </p>
              ) : null}

              <h3 className="mt-5 mb-2 font-sans text-sm font-semibold">Servicios</h3>
              <div className="flex flex-wrap gap-1.5">
                {services.map((s) => (
                  <span key={s.id} className={cx('rounded-full px-3 py-1 text-xs', s.active ? 'bg-blush/60 text-rose-deep' : 'bg-sand text-muted line-through')}>
                    {s.name}
                  </span>
                ))}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
