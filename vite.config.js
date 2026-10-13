import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        // Phase 0 spike entry (design-doc §20) — not part of the live
        // site, only here so `npm run build` reports the real gzip
        // size of the three.js/@react-three/fiber chunk. Remove this
        // input (and spike.html / src/dev) once Phase 0 is done.
        spike: resolve(import.meta.dirname, 'spike.html'),
      },
    },
  },
})
