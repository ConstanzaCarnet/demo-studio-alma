import { Pencil, Plus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '../../components/admin/PageHeader'
import { Sheet } from '../../components/ui/Sheet'
import { SmartImage } from '../../components/ui/SmartImage'
import { useToast } from '../../components/ui/Toast'
import type { Service, ServiceCategory } from '../../domain/types'
import { formatDuration } from '../../lib/dates'
import { cx, formatPrice, normalize } from '../../lib/format'
import { saveService } from '../../services/adminService'
import { useAppData } from '../../services/store'

const CATEGORIES: Record<ServiceCategory, string> = { cabello: 'Cabello', manos: 'Manos', rostro: 'Rostro' }
const PLACEHOLDER_IMG = 'https://images.unsplash.com/photo-1600948836101-f9ffda59d250?auto=format&fit=crop&w=900&q=75'

export default function ServicesAdminPage() {
  const { services, professionals } = useAppData()
  const [editing, setEditing] = useState<Service | null>(null)
  const toast = useToast()

  const blank = (): Service => ({
    id: '',
    name: '',
    category: 'cabello',
    description: '',
    durationMin: 60,
    price: 15000,
    image: PLACEHOLDER_IMG,
    professionalIds: [],
    active: true,
    keywords: [],
  })

  return (
    <>
      <PageHeader
        title="Servicios"
        subtitle="Los cambios se reflejan al instante en el sitio y en el asistente."
        actions={
          <button onClick={() => setEditing(blank())} className="btn-primary">
            <Plus className="size-4" /> Nuevo servicio
          </button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <article key={s.id} className={cx('card flex flex-col overflow-hidden transition', !s.active && 'opacity-60')}>
            <div className="relative">
              <SmartImage src={s.image} alt={s.name} className="h-32" />
              <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold">{CATEGORIES[s.category]}</span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-2xl font-semibold">{s.name}</h3>
                <Toggle
                  checked={s.active}
                  onChange={(v) => {
                    saveService({ ...s, active: v })
                    toast({ kind: 'success', title: v ? `${s.name} activado` : `${s.name} desactivado`, description: v ? 'Ya se puede reservar online.' : 'Ya no aparece en el sitio.' })
                  }}
                />
              </div>
              <p className="mt-1 line-clamp-2 flex-1 text-sm text-ink-soft">{s.description}</p>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-muted">{formatDuration(s.durationMin)}</span>
                <span className="text-lg font-semibold">{formatPrice(s.price)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <div className="flex -space-x-2">
                  {s.professionalIds.map((id) => {
                    const p = professionals.find((x) => x.id === id)
                    return p ? <SmartImage key={id} src={p.photo} alt={p.name} className="size-8 rounded-full ring-2 ring-white" /> : null
                  })}
                </div>
                <button onClick={() => setEditing(s)} className="btn-ghost !px-4 !py-2 !text-[13px]">
                  <Pencil className="size-3.5" /> Editar
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {editing && (
        <ServiceForm
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(s) => {
            const isNew = !s.id
            const id = s.id || normalize(s.name).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36).slice(-3)
            saveService({ ...s, id, keywords: s.keywords.length ? s.keywords : normalize(s.name).split(' ') })
            toast({ kind: 'success', title: isNew ? 'Servicio creado' : 'Cambios guardados', description: `${s.name} ya está actualizado en el sitio.` })
            setEditing(null)
          }}
        />
      )}
    </>
  )
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label ?? (checked ? 'Activo' : 'Inactivo')}
      onClick={() => onChange(!checked)}
      className={cx('relative h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-sage' : 'bg-line')}
    >
      <span className={cx('absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition', checked && 'translate-x-5')} />
    </button>
  )
}

function ServiceForm({ initial, onClose, onSave }: { initial: Service; onClose: () => void; onSave: (s: Service) => void }) {
  const { professionals } = useAppData()
  const [s, setS] = useState(initial)
  const valid = s.name.trim().length > 2 && s.price > 0 && s.durationMin >= 15 && s.professionalIds.length > 0
  const set = <K extends keyof Service>(k: K, v: Service[K]) => setS({ ...s, [k]: v })

  return (
    <Sheet
      open
      onClose={onClose}
      title={initial.id ? 'Editar servicio' : 'Nuevo servicio'}
      footer={
        <div className="flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
          <button onClick={() => onSave(s)} disabled={!valid} className="btn-primary flex-1">
            Guardar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={s.name} onChange={(e) => set('name', e.target.value)} placeholder="Ej.: Peinado para eventos" />
        </div>
        <div>
          <label className="label">Descripción</label>
          <textarea className="input resize-none" rows={2} value={s.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Precio ($)</label>
            <input className="input" type="number" min={0} step={500} value={s.price} onChange={(e) => set('price', Number(e.target.value))} />
          </div>
          <div>
            <label className="label">Duración</label>
            <select className="input" value={s.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))}>
              {[15, 30, 45, 60, 75, 90, 105, 120, 150, 180].map((m) => (
                <option key={m} value={m}>
                  {formatDuration(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Categoría</label>
          <div className="flex gap-2">
            {(Object.keys(CATEGORIES) as ServiceCategory[]).map((c) => (
              <button
                key={c}
                onClick={() => set('category', c)}
                className={cx('flex-1 rounded-2xl border py-2.5 text-sm font-medium', s.category === c ? 'border-ink bg-ink text-ivory' : 'border-line bg-white')}
              >
                {CATEGORIES[c]}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="label">Profesionales que lo realizan</label>
          <div className="space-y-2">
            {professionals.map((p) => {
              const on = s.professionalIds.includes(p.id)
              return (
                <label key={p.id} className={cx('flex cursor-pointer items-center gap-3 rounded-2xl border bg-white p-2.5 pr-4', on ? 'border-ink' : 'border-line')}>
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => set('professionalIds', on ? s.professionalIds.filter((x) => x !== p.id) : [...s.professionalIds, p.id])}
                    className="size-4 accent-[#2a2320]"
                  />
                  <SmartImage src={p.photo} alt={p.name} className="size-8 rounded-full" />
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <span className="text-xs text-muted">{p.role}</span>
                </label>
              )
            })}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-2xl bg-sand/60 p-4">
          <div>
            <p className="text-sm font-semibold">Activo</p>
            <p className="text-xs text-muted">Visible en el sitio y disponible para reservar.</p>
          </div>
          <Toggle checked={s.active} onChange={(v) => set('active', v)} />
        </div>
        {!valid && <p className="text-xs text-muted">Completá nombre, precio y al menos una profesional.</p>}
      </div>
    </Sheet>
  )
}
