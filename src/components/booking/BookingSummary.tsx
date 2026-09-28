import { CalendarDays, Clock, Scissors, User, Wallet } from 'lucide-react'
import type { Professional, Service } from '../../domain/types'
import { formatDuration, formatLongDate, formatShortDay } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { SmartImage } from '../ui/SmartImage'

export interface SummaryProps {
  service?: Service
  professional?: Professional
  anyProfessional?: boolean
  date?: string
  time?: string
}

/** Resumen lateral (desktop). */
export function BookingSummary({ service, professional, anyProfessional, date, time }: SummaryProps) {
  const rows = [
    { icon: Scissors, label: 'Servicio', value: service?.name },
    { icon: Clock, label: 'Duración', value: service && formatDuration(service.durationMin) },
    { icon: User, label: 'Profesional', value: professional?.name ?? (anyProfessional ? 'Primera disponible' : undefined) },
    { icon: CalendarDays, label: 'Fecha', value: date && formatLongDate(date) },
    { icon: Clock, label: 'Horario', value: time && `${time} hs` },
  ]
  return (
    <aside className="card sticky top-24 overflow-hidden">
      {service ? (
        <SmartImage src={service.image} alt={service.name} className="h-36" />
      ) : (
        <div className="grid h-36 place-items-center bg-gradient-to-br from-blush to-sand font-display text-2xl text-rose-deep italic">
          Tu turno
        </div>
      )}
      <div className="p-6">
        <h3 className="text-2xl font-semibold">Resumen</h3>
        <dl className="mt-4 space-y-3">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-3 text-sm">
              <r.icon className="size-4 shrink-0 text-muted" />
              <dt className="w-24 text-muted">{r.label}</dt>
              <dd className={cx('flex-1 text-right font-medium', !r.value && 'text-muted/60')}>{r.value ?? '—'}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Wallet className="size-4" /> Total
          </span>
          <span className="text-2xl font-semibold">{service ? formatPrice(service.price) : '—'}</span>
        </div>
        <p className="mt-2 text-xs text-muted">Se abona en el salón. Sin seña.</p>
      </div>
    </aside>
  )
}

/** Resumen compacto fijo (móvil). */
export function MobileSummary({ service, professional, anyProfessional, date, time }: SummaryProps) {
  if (!service) return null
  const d = date ? formatShortDay(date) : null
  const parts = [
    professional?.name ?? (anyProfessional ? 'Primera disponible' : null),
    d ? `${d.weekday} ${d.day}` : null,
    time ? `${time} hs` : null,
  ].filter(Boolean)
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="flex items-center gap-3">
        <SmartImage src={service.image} alt="" className="size-11 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{service.name}</p>
          <p className="truncate text-xs text-muted">
            {formatDuration(service.durationMin)}
            {parts.length ? ` · ${parts.join(' · ')}` : ''}
          </p>
        </div>
        <p className="text-lg font-semibold">{formatPrice(service.price)}</p>
      </div>
    </div>
  )
}
