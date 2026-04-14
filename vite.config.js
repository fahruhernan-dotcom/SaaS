import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-router-dom/server.js': 'react-router-dom',
      'react-router-dom/server': 'react-router-dom',
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
        "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://open.bigmodel.cn https://api.maiarouter.ai https://api.maia.id https://prod.spline.design https://*.spline.design https://unpkg.com data:",
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
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
    dirStyle: 'nested',
    includedRoutes() {
      return [
        '/',
        '/fitur',
        '/harga',
        '/harga-pasar',
        '/tentang-kami',
        '/hubungi-kami',
        '/faq',
        '/blog',
        '/blog/cara-hitung-fcr-ayam-broiler',
        '/blog/cara-hitung-indeks-performa-ayam-broiler',
        '/blog/cara-mengurangi-angka-kematian-ayam-broiler',
        '/blog/tips-manajemen-kandang-ayam-broiler-pemula',
        '/blog/cara-hitung-keuntungan-peternak-ayam-broiler',
      ]
    },
    onFinished() {
      console.log('SSG Prerendering finished.')
    },
  },
})
