import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppData } from '../../services/store'
import { SmartImage } from '../ui/SmartImage'

export function TeamSection() {
  const { professionals, services } = useAppData()
  return (
    <section id="equipo" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-xl">
          <p className="eyebrow">Profesionales</p>
          <h2 className="mt-3 text-4xl font-medium sm:text-5xl">Nuestro equipo</h2>
          <p className="mt-3 text-ink-soft">Personas apasionadas por lo que hacen, que te escuchan antes de empezar.</p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {professionals
            .filter((p) => p.active)
            .map((p) => {
              const own = services.filter((s) => s.active && s.professionalIds.includes(p.id))
              return (
                <article key={p.id} className="group flex flex-col">
                  <SmartImage src={p.photo} alt={p.name} className="aspect-[4/5] rounded-[28px] transition duration-500 group-hover:rounded-[48px]" />
                  <div className="mt-4 flex flex-1 flex-col">
                    <h3 className="text-3xl font-semibold">{p.name}</h3>
                    <p className="text-sm font-semibold text-rose-deep">{p.role}</p>
                    <p className="mt-2 flex-1 text-[15px] leading-relaxed text-ink-soft">{p.bio}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {own.map((s) => (
                        <span key={s.id} className="rounded-full bg-sand px-2.5 py-1 text-xs text-ink-soft">
                          {s.name}
                        </span>
                      ))}
                    </div>
                    <Link
                      to={`/reservar?profesional=${p.id}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink transition hover:gap-2.5 hover:text-rose-deep"
                    >
                      Reservar con {p.name} <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </article>
              )
            })}
        </div>
      </div>
    </section>
  )
}
