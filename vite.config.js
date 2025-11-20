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
    host: true, // Listen on all addresses
    hmr: {
      overlay: true, // Show errors on screen
    },
    watch: {
      usePolling: true, // Better file watching on some systems
    },
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
