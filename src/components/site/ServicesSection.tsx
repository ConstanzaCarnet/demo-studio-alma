import { Clock, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { whatsappLink } from '../../data/business'
import type { ServiceCategory } from '../../domain/types'
import { formatDuration } from '../../lib/dates'
import { cx, formatPrice } from '../../lib/format'
import { useAppData } from '../../services/store'
import { DemoPill } from '../ui/Logo'
import { SmartImage } from '../ui/SmartImage'

const FILTERS: { id: ServiceCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'cabello', label: 'Cabello' },
  { id: 'manos', label: 'Manos' },
  { id: 'rostro', label: 'Rostro' },
]

export function ServicesSection() {
  const { services } = useAppData()
  const [filter, setFilter] = useState<ServiceCategory | 'all'>('all')
  const visible = services.filter((s) => s.active && (filter === 'all' || s.category === filter))

  return (
    <section id="servicios" className="scroll-mt-20 bg-white/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow">Servicios</p>
            <h2 className="mt-3 text-4xl font-medium sm:text-5xl">Nuestros servicios</h2>
            <p className="mt-3 max-w-md text-ink-soft">Elegí lo que necesitás y reservá en menos de un minuto.</p>
          </div>
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cx(
                  'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition',
                  filter === f.id ? 'border-ink bg-ink text-ivory' : 'border-line bg-white text-ink-soft hover:border-ink/30',
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {visible.map((s, i) => (
            <article
              key={s.id}
              className="group card flex animate-fade-up flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="relative">
                <SmartImage src={s.image} alt={s.name} className="aspect-[16/10] transition duration-700 group-hover:scale-[1.03]" />
                {s.popular && (
                  <span className="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-rose-deep backdrop-blur">
                    Más elegido
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5 sm:p-6">
                <h3 className="text-2xl font-semibold">{s.name}</h3>
                <p className="mt-1.5 flex-1 text-[15px] leading-relaxed text-ink-soft">{s.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
                  <span className="flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-4" /> {formatDuration(s.durationMin)}
                  </span>
                  <span className="text-xl font-semibold">{formatPrice(s.price)}</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link to={`/reservar?servicio=${s.id}`} className="btn-primary flex-1">
                    Reservar
                  </Link>
                  <a
                    href={whatsappLink(`Hola, quiero consultar por un turno para ${s.name}.`)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-ghost !px-3.5"
                    aria-label={`Consultar ${s.name} por WhatsApp`}
                    title="Consultar por WhatsApp"
                  >
                    <MessageCircle className="size-4" />
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 flex items-center justify-center gap-2 text-center text-sm text-muted">
          <DemoPill /> Precios y servicios de ejemplo, personalizables para cada negocio.
        </p>
      </div>
    </section>
  )
}
