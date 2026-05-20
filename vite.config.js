import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages serves at /HRMS-Gamyam/; local dev uses /
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  base: command === 'build' ? '/HRMS-Gamyam/' : '/',
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
