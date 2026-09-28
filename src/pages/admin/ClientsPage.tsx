import { ChevronRight, Mail, Phone, Search, UserRoundX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/admin/PageHeader'
import { WhatsAppIcon } from '../../components/ui/BrandIcons'
import { Sheet } from '../../components/ui/Sheet'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useToast } from '../../components/ui/Toast'
import { formatNumericDate, todayISO } from '../../lib/dates'
import { formatPrice, normalize } from '../../lib/format'
import { saveClientNotes } from '../../services/adminService'
import { clientStats, type ClientStats } from '../../services/stats'
import { useAppData } from '../../services/store'

export default function ClientsPage() {
  const data = useAppData()
  const [q, setQ] = useState('')
  const [openId, setOpenId] = useState<string | null>(null)
  const today = todayISO()
  const serviceName = (id?: string) => data.services.find((s) => s.id === id)?.name ?? '—'

  const rows = useMemo(
    () =>
      data.clients
        .map((c) => clientStats(data, c, today))
        .filter((r) => normalize(`${r.client.firstName} ${r.client.lastName} ${r.client.phone}`).includes(normalize(q)))
        .sort((a, b) => (b.lastVisit?.date ?? '').localeCompare(a.lastVisit?.date ?? '')),
    [data, q, today],
  )
  const selected = rows.find((r) => r.client.id === openId) ?? (openId ? clientStats(data, data.clients.find((c) => c.id === openId)!, today) : null)

  return (
    <>
      <PageHeader title="Clientes" subtitle={`${data.clients.length} clientes registrados`} />
      <div className="relative mb-5 max-w-md">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre o teléfono…" className="input !rounded-full !pl-11" />
      </div>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center py-16 text-center">
          <UserRoundX className="size-8 text-muted" />
          <p className="mt-3 font-semibold">No encontramos clientes</p>
          <p className="text-sm text-muted">Probá con otro nombre o teléfono.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          {/* Tabla desktop */}
          <table className="hidden w-full text-left text-sm md:table">
            <thead className="border-b border-line bg-sand/40 text-xs tracking-wide text-muted uppercase">
              <tr>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Teléfono</th>
                <th className="px-5 py-3 font-semibold">Último turno</th>
                <th className="px-5 py-3 font-semibold">Turnos</th>
                <th className="px-5 py-3 font-semibold">Servicio frecuente</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.client.id} onClick={() => setOpenId(r.client.id)} className="cursor-pointer transition hover:bg-sand/40">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar name={`${r.client.firstName} ${r.client.lastName}`} />
                      <span className="font-semibold">
                        {r.client.firstName} {r.client.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-ink-soft">{r.client.phone}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{r.lastVisit ? formatNumericDate(r.lastVisit.date) : '—'}</td>
                  <td className="px-5 py-3.5 font-semibold">{r.total}</td>
                  <td className="px-5 py-3.5 text-ink-soft">{serviceName(r.favoriteServiceId)}</td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight className="inline size-4 text-muted" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Lista móvil */}
          <ul className="divide-y divide-line md:hidden">
            {rows.map((r) => (
              <li key={r.client.id}>
                <button onClick={() => setOpenId(r.client.id)} className="flex w-full items-center gap-3 p-4 text-left">
                  <Avatar name={`${r.client.firstName} ${r.client.lastName}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {r.client.firstName} {r.client.lastName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {r.total} turnos · {serviceName(r.favoriteServiceId)} · {r.lastVisit ? formatNumericDate(r.lastVisit.date) : 'sin visitas'}
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {selected && <ClientSheet stats={selected} onClose={() => setOpenId(null)} serviceName={serviceName} />}
    </>
  )
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
  return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blush text-xs font-bold text-rose-deep">{initials}</span>
}

function ClientSheet({ stats, onClose, serviceName }: { stats: ClientStats; onClose: () => void; serviceName: (id?: string) => string }) {
  const { client, history } = stats
  const { professionals } = useAppData()
  const toast = useToast()
  const [notes, setNotes] = useState(client.notes ?? '')
  const done = new Map<string, number>()
  history.filter((a) => a.status === 'completed').forEach((a) => done.set(a.serviceId, (done.get(a.serviceId) ?? 0) + 1))

  return (
    <Sheet open onClose={onClose} title={`${client.firstName} ${client.lastName}`} subtitle={`Cliente desde ${formatNumericDate(client.createdAt.slice(0, 10))}`}>
      <div className="flex flex-wrap gap-2">
        <a href={`https://wa.me/${client.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="btn-wa !py-2 !text-[13px]">
          <WhatsAppIcon className="size-4" /> WhatsApp
        </a>
        <a href={`tel:${client.phone}`} className="btn-ghost !py-2 !text-[13px]">
          <Phone className="size-4" /> {client.phone}
        </a>
        {client.email && (
          <a href={`mailto:${client.email}`} className="btn-ghost !py-2 !text-[13px]">
            <Mail className="size-4" /> Email
          </a>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {[
          ['Turnos', String(stats.total)],
          ['Última visita', stats.lastVisit ? formatNumericDate(stats.lastVisit.date) : '—'],
          ['Invertido', formatPrice(stats.spent)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-2xl bg-sand/70 p-3">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-0.5 font-semibold">{v}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm">
        <span className="text-muted">Servicio frecuente:</span> <span className="font-semibold">{serviceName(stats.favoriteServiceId)}</span>
      </p>

      <h3 className="mt-7 mb-2 font-sans text-sm font-semibold">Servicios realizados</h3>
      <div className="flex flex-wrap gap-1.5">
        {[...done.entries()].map(([id, n]) => (
          <span key={id} className="rounded-full bg-white px-3 py-1 text-xs ring-1 ring-line">
            {serviceName(id)} <span className="text-muted">×{n}</span>
          </span>
        ))}
        {!done.size && <span className="text-sm text-muted">Todavía ninguno.</span>}
      </div>

      <h3 className="mt-7 mb-2 font-sans text-sm font-semibold">Notas</h3>
      <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input resize-none text-sm" placeholder="Fórmulas de color, preferencias, alergias…" />
      <button
        onClick={() => {
          saveClientNotes(client.id, notes)
          toast({ kind: 'success', title: 'Notas guardadas' })
        }}
        disabled={notes === (client.notes ?? '')}
        className="btn-primary mt-2 !py-2 !text-[13px]"
      >
        Guardar notas
      </button>

      <h3 className="mt-7 mb-2 font-sans text-sm font-semibold">Historial de turnos</h3>
      <ul className="divide-y divide-line">
        {history.map((a) => (
          <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <div>
              <p className="font-medium">{serviceName(a.serviceId)}</p>
              <p className="text-xs text-muted">
                {formatNumericDate(a.date)} · {a.start} · {professionals.find((p) => p.id === a.professionalId)?.name}
              </p>
            </div>
            <StatusBadge status={a.status} />
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
