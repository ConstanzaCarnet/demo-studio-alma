/**
 * Limpieza de todo texto libre que escribe un visitante (chat y formulario).
 * El texto sólo se trata como dato: nunca se ejecuta ni se interpreta como
 * instrucción, y React lo escapa al mostrarlo.
 */

export const LIMITS = {
  chat: 300,
  name: 40,
  phone: 25,
  email: 80,
  comment: 280,
} as const

// Controles ASCII/C1, y caracteres invisibles o de dirección (zero-width, bidi) usados para ocultar texto.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁩﻿]/g
const ANGLE = /[<>]/g

/** Una línea: sin caracteres invisibles, espacios colapsados y largo acotado. */
export function cleanLine(input: string, max: number): string {
  return input.normalize('NFKC').replace(INVISIBLE, ' ').replace(ANGLE, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

/** Texto multilínea (comentarios): conserva saltos de línea simples. */
export function cleanMultiline(input: string, max: number): string {
  return input
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((l) => cleanLine(l, max))
    .filter(Boolean)
    .slice(0, 5)
    .join('\n')
    .slice(0, max)
}

/** Parámetros de URL: sólo se aceptan con el formato esperado. */
export const isSafeId = (v: string | null): v is string => !!v && /^[a-z0-9_-]{1,40}$/i.test(v)
export const isISODate = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v))
export const isTime = (v: string | null): v is string => !!v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v)
