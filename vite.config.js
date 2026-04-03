import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    headers: {
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://prod.spline.design https://unpkg.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob:",
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://prod.spline.design https://*.spline.design https://unpkg.com data:",
        "frame-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "worker-src 'self' blob:",
        "child-src blob:",
      ].join('; '),
    },
  },
  build: {
    chunkSizeWarningLimit: 3000,
  },
})
