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
    port: 5174, // Match current frontend port
    proxy: {
      '/api': {
        target: 'http://localhost:5044', // ✅ Local backend
        changeOrigin: true,
        secure: false, // HTTP for localhost
        rewrite: (path) => path, // Keep /api prefix
      },
    },
  },
})
