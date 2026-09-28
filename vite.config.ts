import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // En GitHub Pages el sitio vive en /<repo>/; en Vercel o local, en la raíz.
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
})
