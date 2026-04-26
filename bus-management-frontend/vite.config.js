import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5168', // Default .NET API port
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5168',
        ws: true,
        changeOrigin: true,
        secure: false,
      }
    },
  },
})
