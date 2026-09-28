import { Bot, Building2, CalendarClock, Copy, Link2, RotateCcw } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { aiService } from '../../ai/AIService'
import { PageHeader } from '../../components/admin/PageHeader'
import { Sheet } from '../../components/ui/Sheet'
import { useToast } from '../../components/ui/Toast'
import { business } from '../../data/business'
import type { Weekday } from '../../domain/types'
import { WEEKDAY_NAMES } from '../../lib/dates'
import { resetDemoData } from '../../services/adminService'

function Section({ icon: Icon, title, children }: { icon: typeof Bot; title: string; children: ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 font-sans text-base font-semibold">
        <Icon className="size-[18px] text-rose-deep" /> {title}
      </h2>
      <div className="mt-4 text-sm">{children}</div>
    </section>
  )
}

function Item({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-line py-2.5 last:border-0">
      <span className="text-muted">{k}</span>
      <span className="text-right font-medium">{v}</span>
    </div>
  )
}

export default function SettingsPage() {
  const toast = useToast()
  const [confirmReset, setConfirmReset] = useState(false)
  const bookingUrl = `${window.location.origin}${import.meta.env.BASE_URL}reservar`

  return (
    <>
      <PageHeader title="Configuración" subtitle="Datos del negocio, reglas de reserva y asistente." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Section icon={Building2} title="Negocio">
          <Item k="Nombre" v={business.name} />
          <Item k="Dirección" v={`${business.address}, ${business.city}`} />
          <Item k="WhatsApp" v="+54 9 351 000-0000 (demo)" />
          <Item k="Email" v={business.email} />
          {([1, 2, 3, 4, 5, 6, 0] as Weekday[]).map((d) => {
            const h = business.hours[d]
            return <Item key={d} k={WEEKDAY_NAMES[d]} v={h ? `${h.start} – ${h.end}` : 'Cerrado'} />
          })}
        </Section>

        <div className="space-y-5">
          <Section icon={CalendarClock} title="Reglas de reserva">
            <Item k="Intervalo entre horarios" v={`${business.slotStepMin} min`} />
            <Item k="Anticipación mínima" v={`${business.minLeadMin} min`} />
            <Item k="Agenda abierta" v={`${business.bookingWindowDays} días`} />
            <Item k="Seña" v="No requerida" />
            <Item k="Días no laborables" v={business.closedDates.map((d) => `${d.date.split('-').reverse().slice(0, 2).join('/')} (${d.reason})`).join(', ')} />
          </Section>

          <Section icon={Bot} title="Asistente IA">
            <Item k="Nombre" v="Alma" />
            <Item k="Motor" v={aiService.providerName === 'demo' ? 'Modo demo (reglas + datos reales)' : 'IA conectada'} />
            <Item k="Fuente de datos" v="Servicios, equipo, políticas y disponibilidad en vivo" />
            <p className="mt-3 rounded-2xl bg-sand/60 p-3 text-xs leading-relaxed text-ink-soft">
              El asistente consulta el mismo motor de disponibilidad que el sistema de reservas y nunca confirma un turno por sí mismo.
              Puede conectarse a un proveedor de IA real sin cambiar la interfaz.
            </p>
          </Section>

          <Section icon={Link2} title="Link de reservas">
            <p className="text-ink-soft">Para la bio de Instagram, estados de WhatsApp o Google Maps:</p>
            <div className="mt-3 flex gap-2">
              <input readOnly value={bookingUrl} className="input !py-2 text-sm" />
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(bookingUrl).then(
                    () => toast({ kind: 'success', title: 'Link copiado' }),
                    () => toast({ kind: 'error', title: 'No se pudo copiar' }),
                  )
                }}
                className="btn-ghost !px-4 !py-2"
                aria-label="Copiar link"
              >
                <Copy className="size-4" />
              </button>
            </div>
          </Section>

          <Section icon={RotateCcw} title="Datos de demostración">
            <p className="text-ink-soft">Vuelve a generar la agenda, clientes y servicios de ejemplo. Se pierden los turnos cargados en esta demo.</p>
            <button onClick={() => setConfirmReset(true)} className="btn-ghost mt-3 !py-2 !text-[13px]">
              <RotateCcw className="size-4" /> Restablecer datos demo
            </button>
          </Section>
        </div>
      </div>

      <Sheet
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        variant="center"
        title="¿Restablecer la demo?"
        footer={
          <div className="flex gap-2">
            <button onClick={() => setConfirmReset(false)} className="btn-ghost flex-1">
              Cancelar
            </button>
            <button
              onClick={() => {
                resetDemoData()
                setConfirmReset(false)
                toast({ kind: 'success', title: 'Datos de demo restablecidos' })
              }}
              className="btn-accent flex-1"
            >
              Restablecer
            </button>
          </div>
        }
      >
        <p className="text-ink-soft">Se borrarán los turnos creados y los cambios en servicios. Esta acción no se puede deshacer.</p>
      </Sheet>
    </>
  )
}
