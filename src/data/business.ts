import type { BusinessInfo } from '../domain/types'

/**
 * Configuración del negocio. Para adaptar la demo a otro local
 * (barbería, spa, manicuría…) se cambia este archivo y los seeds.
 */
export const business: BusinessInfo = {
  name: 'Studio Alma',
  tagline: 'Belleza, cuidado y bienestar',
  address: 'Av. Ejemplo 1234',
  city: 'Córdoba, Argentina',
  whatsapp: '5493510000000', // número ficticio
  instagram: 'https://instagram.com/',
  facebook: 'https://facebook.com/',
  email: 'hola@studioalma.demo',
  hours: {
    0: null,
    1: { start: '09:00', end: '20:00', breaks: [] },
    2: { start: '09:00', end: '20:00', breaks: [] },
    3: { start: '09:00', end: '20:00', breaks: [] },
    4: { start: '09:00', end: '20:00', breaks: [] },
    5: { start: '09:00', end: '20:00', breaks: [] },
    6: { start: '09:00', end: '18:00', breaks: [] },
  },
  closedDates: [{ date: '2026-10-12', reason: 'Feriado nacional' }],
  slotStepMin: 30,
  minLeadMin: 60,
  bookingWindowDays: 21,
  policies: [
    {
      id: 'cancelacion',
      title: 'Cancelaciones y cambios',
      text: 'Podés cancelar o reprogramar tu turno sin costo hasta 24 horas antes, escribiéndonos por WhatsApp.',
      keywords: ['cancelar', 'cancelo', 'reprogramar', 'cambiar', 'mover', 'no puedo ir'],
    },
    {
      id: 'pagos',
      title: 'Medios de pago',
      text: 'Aceptamos efectivo, transferencia, tarjetas de débito y crédito, y Mercado Pago.',
      keywords: ['pago', 'pagar', 'tarjeta', 'efectivo', 'transferencia', 'mercado pago', 'cuotas'],
    },
    {
      id: 'puntualidad',
      title: 'Puntualidad',
      text: 'Te pedimos llegar 5 minutos antes. Con más de 15 minutos de demora podemos tener que reprogramar para no afectar a otros clientes.',
      keywords: ['tarde', 'demora', 'llegar', 'puntual', 'tolerancia'],
    },
    {
      id: 'sena',
      title: 'Señas',
      text: 'Por ahora no pedimos seña para reservar: tu turno queda confirmado al instante.',
      keywords: ['seña', 'sena', 'adelanto', 'deposito'],
    },
  ],
}

export function whatsappLink(message: string): string {
  return `https://wa.me/${business.whatsapp}?text=${encodeURIComponent(message)}`
}
