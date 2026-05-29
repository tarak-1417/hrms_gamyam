import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Netlify serves at root /; use '/' for both dev and production
export default defineConfig(() => ({
  plugins: [react(), tailwindcss()],
  base: '/',
  server: {
    // Listen on all interfaces so phones/other PCs on the same Wi‑Fi can connect
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('@xyflow')) return 'xyflow'
          if (id.includes('recharts') || id.includes('d3-')) return 'charts'
          if (id.includes('xlsx')) return 'xlsx'
          if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor'
          if (id.includes('react-redux') || id.includes('@reduxjs')) return 'redux'
        },
      },
    },
  },
}))
