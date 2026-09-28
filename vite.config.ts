import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/**
 * Política de seguridad del sitio publicado. `connect-src 'self'` impide que la
 * página se comunique con cualquier servidor externo (sin APIs, sin envío de datos).
 * Mantener en sincronía con vercel.json.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.unsplash.com",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-src 'none'",
].join('; ')

/** Sólo en build: en desarrollo Vite necesita scripts inline. */
const cspMeta = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
})

export default defineConfig({
  // En GitHub Pages el sitio vive en /<repo>/; en Vercel o local, en la raíz.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss(), cspMeta()],
})
