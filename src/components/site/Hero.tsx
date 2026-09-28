import { ArrowRight, CalendarHeart, Clock, Sparkles } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatRelativeDate } from '../../lib/dates'
import { ANY_PROFESSIONAL, queryRange } from '../../services/bookingService'
import { useAppData } from '../../services/store'
import { todayISO } from '../../lib/dates'
import { useAssistant } from '../assistant/AssistantWidget'
import { SmartImage } from '../ui/SmartImage'

export function Hero() {
  const data = useAppData()
  const assistant = useAssistant()

  // "Próximo turno libre" calculado en vivo con el motor de disponibilidad.
  const next = useMemo(() => {
    const service = data.services.find((s) => s.id === 'brushing' && s.active) ?? data.services.find((s) => s.active)
    if (!service) return null
    const day = queryRange(service.id, ANY_PROFESSIONAL, todayISO(), 7).find((d) => d.availableCount > 0)
    const slot = day?.slots.find((s) => s.available)
    if (!day || !slot) return null
    const pro = data.professionals.find((p) => p.id === slot.professionalIds[0])
    return { service, date: day.date, time: slot.time, pro }
  }, [data])

  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -right-40 size-[520px] rounded-full bg-blush/60 blur-3xl" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pt-6 pb-16 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:pt-10 lg:pb-24">
        <div className="relative animate-fade-up">
          <p className="eyebrow">Studio Alma · Córdoba</p>
          <h1 className="mt-4 text-[44px] leading-[1.02] font-medium text-balance sm:text-6xl lg:text-7xl">
            Tu momento de <em className="text-rose-deep">cuidarte</em> empieza acá.
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Servicios de belleza y bienestar personalizados, con profesionales que se ocupan de vos.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/reservar" className="btn-primary !px-7 !py-4 !text-[15px]">
              <CalendarHeart className="size-[18px]" />
              Reservar turno
            </Link>
            <Link to="/#servicios" className="btn-ghost !px-7 !py-4 !text-[15px]">
              Ver servicios <ArrowRight className="size-4" />
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted">Reservas online · Atención personalizada · Horarios flexibles</p>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:120ms] lg:max-w-none">
          <SmartImage
            src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1100&q=75"
            alt="Interior de Studio Alma"
            className="aspect-[4/5] rounded-t-[999px] rounded-b-[36px] shadow-lift"
          />
          {next && (
            <Link
              to={`/reservar?servicio=${next.service.id}&profesional=${next.pro?.id}&fecha=${next.date}&hora=${next.time}`}
              className="absolute -bottom-5 -left-2 flex items-center gap-3 rounded-2xl border border-line bg-white/95 p-3.5 pr-5 shadow-lift backdrop-blur transition hover:-translate-y-0.5 sm:-left-8"
            >
              <span className="grid size-11 place-items-center rounded-xl bg-blush text-rose-deep">
                <Clock className="size-5" />
              </span>
              <span>
                <span className="block text-xs text-muted">Próximo turno libre</span>
                <span className="block text-sm font-semibold">
                  {formatRelativeDate(next.date)} · {next.time} hs
                </span>
                <span className="block text-xs text-ink-soft">
                  {next.service.name}
                  {next.pro ? ` con ${next.pro.name}` : ''}
                </span>
              </span>
            </Link>
          )}
          <button
            onClick={() => assistant.open()}
            className="absolute top-8 -right-2 flex items-center gap-2 rounded-full border border-line bg-white/95 py-2 pr-4 pl-2 text-sm font-medium shadow-lift backdrop-blur transition hover:-translate-y-0.5 sm:-right-6"
          >
            <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-rose to-gold text-white">
              <Sparkles className="size-4" />
            </span>
            ¿Dudas? Preguntale a Alma
          </button>
        </div>
      </div>
    </section>
  )
}
