import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    exclude: ['@tailwindcss/oxide'],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://retro-gaming-world.onrender.com',
        changeOrigin: true,
        secure: false
      }
    }
  }
})





