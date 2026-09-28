import { CalendarHeart, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { business, whatsappLink } from '../../data/business'
import { cx } from '../../lib/format'
import { InstagramIcon, WhatsAppIcon } from '../ui/BrandIcons'
import { Logo } from '../ui/Logo'

export const NAV = [
  { label: 'Inicio', to: '/#inicio' },
  { label: 'Servicios', to: '/#servicios' },
  { label: 'Profesionales', to: '/#equipo' },
  { label: 'Nosotros', to: '/#nosotros' },
  { label: 'Contacto', to: '/#contacto' },
]

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
  }, [open])

  return (
    <header
      className={cx(
        'sticky top-0 z-40 transition duration-300',
        scrolled ? 'border-b border-line/70 bg-ivory/85 backdrop-blur-md' : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Logo />
        <nav className="hidden items-center gap-8 lg:flex">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className="text-sm font-medium text-ink-soft transition hover:text-rose-deep">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/reservar" className="btn-primary hidden sm:inline-flex">
            <CalendarHeart className="size-4" />
            Reservar turno
          </Link>
          <button
            onClick={() => setOpen(true)}
            className="grid size-11 place-items-center rounded-full border border-line bg-white/70 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-ivory lg:hidden">
          <div className="flex h-[72px] items-center justify-between px-4">
            <Logo />
            <button onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full border border-line" aria-label="Cerrar menú">
              <X className="size-5" />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 px-6 pt-6">
            {NAV.map((n, i) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="animate-fade-up border-b border-line py-4 font-display text-4xl font-medium"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-3 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            <Link to="/reservar" onClick={() => setOpen(false)} className="btn-primary w-full !py-4">
              <CalendarHeart className="size-4" /> Reservar turno
            </Link>
            <div className="flex gap-3">
              <a href={whatsappLink('Hola, quiero hacer una consulta.')} target="_blank" rel="noreferrer" className="btn-ghost flex-1">
                <WhatsAppIcon className="size-4 text-[#1b8a4b]" /> WhatsApp
              </a>
              <a href={business.instagram} target="_blank" rel="noreferrer" className="btn-ghost flex-1">
                <InstagramIcon className="size-4" /> Instagram
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
