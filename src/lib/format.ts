export function formatPrice(n: number): string {
  return `$${n.toLocaleString('es-AR')}`
}

/** Minúsculas y sin tildes (conserva la ñ: "uñas" ≠ "unas"), para comparar texto libre. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/ñ/g, '\u0000')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\u0000/g, 'ñ')
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}
