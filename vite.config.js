import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom']
        }
      }
    }
  },
  server: {
    port: 5173, // Force port 5173 to match backend CORS
    proxy: {
      '/api': {
        target: 'https://ev-and-battery-trading-platform-be.onrender.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
