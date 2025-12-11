import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  },
  base: process.env.NODE_ENV === 'production' ? '/line-miniapp-decopon/' : '/',
  define: {
    global: 'globalThis'
  }
})