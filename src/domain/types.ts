/** Hora en formato "HH:MM" (24 h). */
export type Time = string
/** Fecha local en formato "YYYY-MM-DD". */
export type ISODate = string
/** 0 = domingo … 6 = sábado (igual que Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface TimeRange {
  start: Time
  end: Time
}

export interface DaySchedule extends TimeRange {
  breaks: TimeRange[]
}

export type WeeklySchedule = Partial<Record<Weekday, DaySchedule | null>>

export type ServiceCategory = 'cabello' | 'manos' | 'rostro'

export interface Service {
  id: string
  name: string
  category: ServiceCategory
  description: string
  durationMin: number
  price: number
  image: string
  professionalIds: string[]
  active: boolean
  /** Palabras clave que ayudan al asistente a recomendar el servicio. */
  keywords: string[]
  popular?: boolean
}

export interface Professional {
  id: string
  name: string
  role: string
  bio: string
  photo: string
  schedule: WeeklySchedule
  active: boolean
}

export interface Client {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  notes?: string
  createdAt: string
}

export type AppointmentStatus = 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'no_show'
export type AppointmentSource = 'seed' | 'web' | 'assistant' | 'admin'

export interface Appointment {
  id: string
  serviceId: string
  professionalId: string
  clientId: string
  date: ISODate
  start: Time
  durationMin: number
  price: number
  status: AppointmentStatus
  comment?: string
  source: AppointmentSource
  createdAt: string
}

export interface BusinessInfo {
  name: string
  tagline: string
  address: string
  city: string
  whatsapp: string
  instagram: string
  facebook: string
  email: string
  hours: WeeklySchedule
  /** Días cerrados puntuales (feriados, vacaciones). */
  closedDates: { date: ISODate; reason: string }[]
  slotStepMin: number
  /** Anticipación mínima para reservar el mismo día. */
  minLeadMin: number
  bookingWindowDays: number
  policies: { id: string; title: string; text: string; keywords: string[] }[]
}

export interface AppData {
  services: Service[]
  professionals: Professional[]
  clients: Client[]
  appointments: Appointment[]
}
