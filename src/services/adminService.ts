import type { AppointmentStatus, Service } from '../domain/types'
import { store } from './store'

export function setAppointmentStatus(id: string, status: AppointmentStatus) {
  store.setState((s) => ({
    appointments: s.appointments.map((a) => (a.id === id ? { ...a, status } : a)),
  }))
}

export function saveService(service: Service) {
  store.setState((s) => ({
    services: s.services.some((x) => x.id === service.id)
      ? s.services.map((x) => (x.id === service.id ? service : x))
      : [...s.services, service],
  }))
}

export function setProfessionalActive(id: string, active: boolean) {
  store.setState((s) => ({
    professionals: s.professionals.map((p) => (p.id === id ? { ...p, active } : p)),
  }))
}

export function saveClientNotes(id: string, notes: string) {
  store.setState((s) => ({
    clients: s.clients.map((c) => (c.id === id ? { ...c, notes } : c)),
  }))
}

export function resetDemoData() {
  store.reset()
}
