import { HeartHandshake, Leaf, Quote, Sparkles } from 'lucide-react'
import { SmartImage } from '../ui/SmartImage'

const VALUES = [
  { icon: HeartHandshake, title: 'Atención personalizada', text: 'Cada visita empieza con una charla para entender qué buscás.' },
  { icon: Leaf, title: 'Productos de calidad', text: 'Trabajamos con marcas profesionales que cuidan tu pelo y tu piel.' },
  { icon: Sparkles, title: 'Un espacio para vos', text: 'Un ambiente cálido y tranquilo, pensado para que te relajes.' },
]

const TESTIMONIALS = [
  { name: 'Camila R.', text: 'Reservé desde Instagram en un minuto. Lucía entendió exactamente el color que quería.' },
  { name: 'Valentina P.', text: 'La limpieza facial con Martina es mi momento del mes. Súper recomendable.' },
  { name: 'Florencia L.', text: 'Las uñas me duran impecables tres semanas. Carla es una genia.' },
]

export function AboutSection() {
  return (
    <section id="nosotros" className="scroll-mt-20 bg-ink py-20 text-ivory sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold tracking-[0.2em] text-blush uppercase">Nosotros</p>
            <h2 className="mt-3 text-4xl font-medium sm:text-5xl">
              Belleza con tiempo, <em className="text-blush">cuidado</em> con detalle.
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-ivory/75">
              Studio Alma nació para ser ese lugar al que querés volver. Combinamos técnica, escucha y un espacio cálido para que cada
              visita sea un momento para vos.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {VALUES.map((v) => (
                <div key={v.title}>
                  <v.icon className="size-6 text-blush" />
                  <h3 className="mt-3 font-sans text-base font-semibold">{v.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-ivory/65">{v.text}</p>
                </div>
              ))}
            </div>
          </div>
          <SmartImage
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1000&q=75"
            alt="Espacio de Studio Alma"
            className="aspect-[5/4] rounded-[32px]"
          />
        </div>

        <div className="mt-20 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <figure key={t.name} className="rounded-3xl border border-ivory/10 bg-ivory/5 p-6">
              <Quote className="size-6 text-blush/70" />
              <blockquote className="mt-3 font-display text-xl leading-snug">{t.text}</blockquote>
              <figcaption className="mt-4 text-sm text-ivory/60">{t.name}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
