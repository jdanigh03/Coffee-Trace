import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Sin `rewrite`: el backend monta sus rutas con el prefijo /api
      // (/api/lots, /api/analytics...). Quitarlo aqui daria 404.
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
