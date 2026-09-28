import { CalendarDays, ExternalLink, LayoutDashboard, Menu, Scissors, Settings, UserRound, Users, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { DemoPill, Logo } from '../../components/ui/Logo'
import { cx } from '../../lib/format'
import { useAppData } from '../../services/store'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/turnos', label: 'Turnos', icon: CalendarDays },
  { to: '/admin/clientes', label: 'Clientes', icon: Users },
  { to: '/admin/servicios', label: 'Servicios', icon: Scissors },
  { to: '/admin/profesionales', label: 'Profesionales', icon: UserRound },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function AdminLayout() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { appointments } = useAppData()
  const online = appointments.filter((a) => a.source !== 'seed' && Date.now() - new Date(a.createdAt).getTime() < 86400000).length

  useEffect(() => setOpen(false), [pathname])

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((n) => (
        <NavLink
          key={n.to}
          to={n.to}
          end={n.end}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition',
              isActive ? 'bg-ink text-ivory shadow-soft' : 'text-ink-soft hover:bg-white hover:text-ink',
            )
          }
        >
          <n.icon className="size-[18px]" />
          <span className="flex-1">{n.label}</span>
          {n.label === 'Turnos' && online > 0 && (
            <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-white" title="Reservas online (24 h)">
              {online}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="space-y-3">
      <Link to="/" className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3.5 py-2.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ExternalLink className="size-4" /> Ver sitio público
      </Link>
      <div className="flex items-center gap-3 px-1">
        <span className="grid size-9 place-items-center rounded-full bg-blush font-semibold text-rose-deep">A</span>
        <div className="min-w-0 text-sm leading-tight">
          <p className="font-semibold">Andrea (dueña)</p>
          <p className="text-xs text-muted">Studio Alma</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-dvh bg-[#f7f3ee]">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col justify-between border-r border-line bg-sand/60 p-5 lg:flex">
        <div>
          <div className="flex items-center justify-between">
            <Logo to="/admin" />
          </div>
          <div className="mt-2 mb-6 pl-12">
            <DemoPill />
          </div>
          {nav}
        </div>
        {footer}
      </aside>

      {/* Topbar móvil */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-[#f7f3ee]/90 px-4 backdrop-blur lg:hidden">
        <Logo to="/admin" compact />
        <DemoPill />
        <button onClick={() => setOpen(true)} className="grid size-10 place-items-center rounded-full border border-line bg-white" aria-label="Abrir menú">
          <Menu className="size-5" />
        </button>
      </header>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-ink/30" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-fade-in flex-col justify-between bg-ivory p-5">
            <div>
              <div className="mb-6 flex items-center justify-between">
                <Logo to="/admin" />
                <button onClick={() => setOpen(false)} className="rounded-full p-2 text-muted" aria-label="Cerrar menú">
                  <X className="size-5" />
                </button>
              </div>
              {nav}
            </div>
            {footer}
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
