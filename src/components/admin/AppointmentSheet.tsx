import { CalendarDays, Clock, MessageSquareText, Phone, Scissors, Sparkles, User, Wallet } from 'lucide-react'
import type { AppointmentStatus } from '../../domain/types'
import { formatDuration, formatLongDate, minToTime, timeToMin } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { setAppointmentStatus } from '../../services/adminService'
import { STATUS_LABEL } from '../../services/stats'
import { useAppData } from '../../services/store'
import { WhatsAppIcon } from '../ui/BrandIcons'
import { Sheet } from '../ui/Sheet'
import { STATUS_STYLE, StatusBadge } from '../ui/StatusBadge'
import { useToast } from '../ui/Toast'

const STATUSES: AppointmentStatus[] = ['confirmed', 'pending', 'completed', 'cancelled', 'no_show']
const SOURCE_LABEL = { seed: 'Carga manual', web: 'Reserva online', assistant: 'Reserva vía asistente IA', admin: 'Panel' }

export function AppointmentSheet({ appointmentId, onClose }: { appointmentId: string | null; onClose: () => void }) {
  const { appointments, services, professionals, clients } = useAppData()
  const toast = useToast()
  const a = appointments.find((x) => x.id === appointmentId)
  if (!a) return null
  const service = services.find((s) => s.id === a.serviceId)
  const pro = professionals.find((p) => p.id === a.professionalId)
  const client = clients.find((c) => c.id === a.clientId)
  const end = minToTime(timeToMin(a.start) + a.durationMin)

  const change = (status: AppointmentStatus) => {
    setAppointmentStatus(a.id, status)
    toast({ kind: 'success', title: `Turno marcado como ${STATUS_LABEL[status].toLowerCase()}` })
  }

  const reminder = `Hola ${client?.firstName}! Te recordamos tu turno en Studio Alma: ${service?.name} con ${pro?.name}, ${formatLongDate(a.date).toLowerCase()} a las ${a.start} hs. ¡Te esperamos! ✨`
  const phone = client?.phone.replace(/\D/g, '')

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${client?.firstName} ${client?.lastName}`}
      subtitle={<StatusBadge status={a.status} className="mt-1" />}
      footer={
        <a href={`https://wa.me/${phone}?text=${encodeURIComponent(reminder)}`} target="_blank" rel="noreferrer" className="btn-wa w-full">
          <WhatsAppIcon className="size-4" /> Enviar recordatorio por WhatsApp
        </a>
      }
    >
      <dl className="space-y-3.5 text-sm">
        <Row icon={Scissors} label="Servicio" value={service?.name} />
        <Row icon={User} label="Profesional" value={pro?.name} />
        <Row icon={CalendarDays} label="Fecha" value={formatLongDate(a.date)} />
        <Row icon={Clock} label="Horario" value={`${a.start} – ${end} (${formatDuration(a.durationMin)})`} />
        <Row icon={Wallet} label="Precio" value={formatPrice(a.price)} />
        <Row icon={Phone} label="Teléfono" value={client?.phone} />
        <Row icon={a.source === 'assistant' ? Sparkles : CalendarDays} label="Origen" value={SOURCE_LABEL[a.source]} />
        {a.comment && <Row icon={MessageSquareText} label="Comentario" value={a.comment} />}
      </dl>

      <h3 className="mt-8 mb-3 font-sans text-sm font-semibold">Cambiar estado</h3>
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map((s) => {
          const Icon = STATUS_STYLE[s].icon
          return (
            <button
              key={s}
              onClick={() => change(s)}
              disabled={a.status === s}
              className={cx(
                'flex items-center gap-2 rounded-2xl border px-3.5 py-3 text-sm font-medium transition disabled:cursor-default',
                a.status === s ? cx(STATUS_STYLE[s].badge, 'border-transparent') : 'border-line bg-white hover:border-ink/30',
              )}
            >
              <Icon className="size-4" /> {STATUS_LABEL[s]}
            </button>
          )
        })}
      </div>
      {client?.notes && (
        <div className="mt-8 rounded-2xl bg-sand/70 p-4 text-sm">
          <p className="font-semibold">Notas del cliente</p>
          <p className="mt-1 text-ink-soft">{client.notes}</p>
        </div>
      )}
    </Sheet>
  )
}

function Row({ icon: Icon, label, value }: { icon: typeof Clock; label: string; value?: string }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted" />
      <dt className="w-24 shrink-0 text-muted">{label}</dt>
      <dd className="font-medium">{value ?? '—'}</dd>
    </div>
  )
}
