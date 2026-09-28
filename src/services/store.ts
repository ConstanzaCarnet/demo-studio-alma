import { useSyncExternalStore } from 'react'
import { seedClients, seedProfessionals, seedServices } from '../data/seed'
import { generateSeedAppointments } from '../data/seedAppointments'
import type { AppData } from '../domain/types'
import { todayISO } from '../lib/dates'

/**
 * Store en memoria + localStorage. Reemplazable por una API/base de datos:
 * la UI sólo depende de getState/setState/subscribe y de los servicios de dominio.
 */
interface PersistedState extends AppData {
  version: number
  seededOn: string
}

const KEY = 'studio-alma-demo'
const VERSION = 1

function freshState(): PersistedState {
  const now = new Date()
  const today = todayISO(now)
  return {
    version: VERSION,
    seededOn: today,
    services: structuredClone(seedServices),
    professionals: structuredClone(seedProfessionals),
    clients: structuredClone(seedClients),
    appointments: generateSeedAppointments(seedServices, seedProfessionals, seedClients, today, now),
  }
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return freshState()
    const saved = JSON.parse(raw) as PersistedState
    if (saved.version !== VERSION) return freshState()
    // En un día nuevo se regenera la agenda semilla (la demo siempre luce "viva"),
    // conservando los turnos y datos cargados por el usuario.
    if (saved.seededOn !== todayISO()) {
      const fresh = freshState()
      return {
        ...saved,
        seededOn: fresh.seededOn,
        appointments: [...fresh.appointments, ...saved.appointments.filter((a) => a.source !== 'seed')],
      }
    }
    return saved
  } catch {
    return freshState()
  }
}

let state: PersistedState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* modo privado o storage lleno: la demo sigue en memoria */
  }
}
persist()

export const store = {
  getState: (): AppData => state,
  setState(updater: (s: AppData) => Partial<AppData>) {
    state = { ...state, ...updater(state) }
    persist()
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  reset() {
    state = freshState()
    persist()
    listeners.forEach((l) => l())
  },
}

// Sincroniza entre pestañas (sitio público en una, panel admin en otra).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key !== KEY) return
    state = load()
    listeners.forEach((l) => l())
  })
}

export function useAppData(): AppData {
  return useSyncExternalStore(store.subscribe, store.getState)
}
