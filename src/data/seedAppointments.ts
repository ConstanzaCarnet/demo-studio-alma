import type { Appointment, AppointmentStatus, Client, ISODate, Professional, Service } from '../domain/types'
import { addDays, parseISODate, timeToMin } from '../lib/dates'
import { getDayAvailability, workingWindow } from '../services/availability'

/** PRNG determinístico para que la demo sea estable durante el día. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CLIENT_WEIGHTS: Record<string, number> = { 'cli-maria': 4, 'cli-julieta': 3, 'cli-valentina': 2, 'cli-florencia': 2 }
const FAVORITES: Record<string, string> = {
  'cli-maria': 'coloracion',
  'cli-julieta': 'coloracion',
  'cli-valentina': 'limpieza-facial',
  'cli-florencia': 'semipermanente',
  'cli-martin': 'corte-styling',
}

/**
 * Genera turnos realistas alrededor de "hoy": historial de 4 semanas,
 * una agenda de hoy con ~12 turnos y los próximos días parcialmente ocupados.
 */
export function generateSeedAppointments(
  services: Service[],
  professionals: Professional[],
  clients: Client[],
  today: ISODate,
  now: Date,
): Appointment[] {
  const rand = mulberry32(Number(today.replaceAll('-', '')))
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const weightedClients = clients.flatMap((c) => Array(CLIENT_WEIGHTS[c.id] ?? 1).fill(c) as Client[])
  const nowMin = now.getHours() * 60 + now.getMinutes()
  const appointments: Appointment[] = []
  let n = 0

  for (let offset = -28; offset <= 10; offset++) {
    const date = addDays(today, offset)
    const working = professionals.filter((p) => workingWindow(p, date))
    const fill = offset < 0 ? 0.55 + rand() * 0.2 : offset === 0 ? 0 : offset === 1 ? 0.45 : offset <= 4 ? 0.3 : 0.15

    for (const pro of working) {
      const w = workingWindow(pro, date)!
      const windowMin = timeToMin(w.end) - timeToMin(w.start)
      const target = offset === 0 ? Math.ceil(12 / working.length) : Math.round((fill * windowMin) / 70)
      const proServices = services.filter((s) => s.professionalIds.includes(pro.id))

      for (let attempt = 0, created = 0; created < target && attempt < target * 4; attempt++) {
        const client = pick(weightedClients)
        const fav = services.find((s) => s.id === FAVORITES[client.id] && s.professionalIds.includes(pro.id))
        const service = fav && rand() < 0.7 ? fav : pick(proServices)
        const day = getDayAvailability({ service, professionals: [pro], date, appointments, ignorePast: true })
        const free = day.slots.filter((s) => s.available)
        if (!free.length) continue
        const slot = pick(free)
        const end = timeToMin(slot.time) + service.durationMin

        let status: AppointmentStatus
        const r = rand()
        if (offset < 0) status = r < 0.86 ? 'completed' : r < 0.93 ? 'no_show' : 'cancelled'
        else if (offset === 0 && end <= nowMin) status = 'completed'
        else status = r < 0.78 ? 'confirmed' : r < 0.95 ? 'pending' : 'cancelled'

        const created_at = parseISODate(addDays(date, -Math.ceil(rand() * 6)))
        appointments.push({
          id: `apt-seed-${++n}`,
          serviceId: service.id,
          professionalId: pro.id,
          clientId: client.id,
          date,
          start: slot.time,
          durationMin: service.durationMin,
          price: service.price,
          status,
          source: 'seed',
          createdAt: created_at.toISOString(),
        })
        created++
      }
    }
  }

  // Hoy siempre hay al menos un cancelado y un pendiente para mostrar los estados.
  const todays = appointments.filter((a) => a.date === today && a.status !== 'completed')
  if (todays.length >= 3 && !todays.some((a) => a.status === 'cancelled')) todays[todays.length - 1].status = 'cancelled'
  if (todays.length >= 3 && !todays.some((a) => a.status === 'pending')) todays[0].status = 'pending'

  return appointments
}
