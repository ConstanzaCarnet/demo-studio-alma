import { Clock, LayoutDashboard, Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { business, whatsappLink } from '../../data/business'
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'
import { Logo } from '../ui/Logo'
import { NAV } from './SiteHeader'

export function ContactSection() {
  return (
    <section id="contacto" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="card grid overflow-hidden lg:grid-cols-[1.2fr_1fr]">
          <div className="p-7 sm:p-12">
            <p className="eyebrow">Contacto</p>
            <h2 className="mt-3 text-4xl font-medium sm:text-5xl">Vení a visitarnos</h2>
            <dl className="mt-8 grid gap-6 sm:grid-cols-2">
              <div className="flex gap-3">
                <MapPin className="mt-0.5 size-5 shrink-0 text-rose-deep" />
                <div>
                  <dt className="font-semibold">Dirección</dt>
                  <dd className="text-ink-soft">
                    {business.address}
                    <br />
                    {business.city}
                  </dd>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="mt-0.5 size-5 shrink-0 text-rose-deep" />
                <div>
                  <dt className="font-semibold">Horarios</dt>
                  <dd className="text-ink-soft">
                    Lunes a viernes: 09:00 - 20:00
                    <br />
                    Sábados: 09:00 - 18:00
                  </dd>
                </div>
              </div>
            </dl>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={whatsappLink('Hola, quiero reservar un turno en Studio Alma.')} target="_blank" rel="noreferrer" className="btn-wa">
                <WhatsAppIcon className="size-4" /> Reservar por WhatsApp
              </a>
              <Link to="/reservar" className="btn-ghost">
                Reservar online
              </Link>
            </div>
          </div>
          <div className="relative min-h-64 bg-sand">
            {/* Mapa ilustrativo (la dirección es ficticia) */}
            <svg className="absolute inset-0 size-full text-shell" preserveAspectRatio="none" viewBox="0 0 400 300" aria-hidden="true">
              <path d="M0 80 L400 40 M0 200 L400 170 M120 0 L90 300 M290 0 L320 300 M0 130 C150 110 250 140 400 110" stroke="currentColor" strokeWidth="14" fill="none" />
              <path d="M0 80 L400 40 M0 200 L400 170 M120 0 L90 300 M290 0 L320 300" stroke="#fff" strokeWidth="2" strokeDasharray="6 8" fill="none" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full">
              <div className="grid size-12 place-items-center rounded-full rounded-br-none bg-ink text-blush shadow-lift [transform:rotate(45deg)]">
                <span className="font-display text-xl italic [transform:rotate(-45deg)]">A</span>
              </div>
            </div>
            <p className="absolute right-4 bottom-4 left-4 rounded-2xl bg-white/90 p-3 text-center text-sm backdrop-blur">
              {business.address} · {business.city}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export function SiteFooter() {
  const socials = [
    { label: 'Instagram', href: business.instagram, icon: InstagramIcon },
    { label: 'WhatsApp', href: whatsappLink('Hola, tengo una consulta.'), icon: WhatsAppIcon },
    { label: 'Facebook', href: business.facebook, icon: FacebookIcon },
  ]
  return (
    <footer className="border-t border-line bg-sand/60 pt-16 pb-28 sm:pb-12">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-ink-soft">Belleza, cuidado y bienestar.</p>
          <div className="mt-5 flex gap-2">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                aria-label={s.label}
                className="grid size-10 place-items-center rounded-full border border-line bg-white text-ink transition hover:border-ink hover:bg-ink hover:text-ivory"
              >
                <s.icon className="size-[18px]" />
              </a>
            ))}
          </div>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold">Visitanos</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            {business.address}
            <br />
            {business.city}
          </p>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold">Horarios</h3>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">
            Lunes a viernes: 09:00 - 20:00
            <br />
            Sábados: 09:00 - 18:00
            <br />
            Domingos: cerrado
          </p>
        </div>
        <div>
          <h3 className="font-sans text-sm font-semibold">Contacto</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>
              <a href={whatsappLink('Hola, tengo una consulta.')} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink">
                <WhatsAppIcon className="size-4" /> WhatsApp
              </a>
            </li>
            <li>
              <a href={business.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink">
                <InstagramIcon className="size-4" /> Instagram
              </a>
            </li>
            <li>
              <a href={`mailto:${business.email}`} className="flex items-center gap-2 hover:text-ink">
                <Mail className="size-4" /> {business.email}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-4 border-t border-line px-4 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <nav className="flex flex-wrap gap-x-5 gap-y-2">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <span>© {new Date().getFullYear()} Studio Alma · Sitio demo</span>
          <Link to="/admin" className="flex items-center gap-1.5 font-semibold text-ink-soft hover:text-ink">
            <LayoutDashboard className="size-3.5" /> Panel del negocio
          </Link>
        </div>
      </div>
    </footer>
  )
}
