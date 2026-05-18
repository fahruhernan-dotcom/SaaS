import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // manifest is managed via public/manifest.webmanifest
      manifest: false,
      workbox: {
        // Do NOT intercept navigation — SSG's 200.html stays in charge of routing
        navigateFallback: null,
        // No local asset precaching: TernakOS requires Supabase to function, so
        // precaching large JS bundles has no offline benefit and wastes mobile bandwidth.
        // Fonts are handled via runtimeCaching below.
        globPatterns: [],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      // Disable SW in dev to avoid interfering with HMR and Supabase auth flows
      devOptions: { enabled: false },
    }),
  ],
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
    script: 'defer',
    formatting: 'minify',
    dirStyle: 'nested',
    includedRoutes() {
      return [
        '/',
        '/fitur',
        '/fitur/rpa',
        '/fitur/broker/ayam',
        '/fitur/broker/telur',
        '/fitur/broker/sembako',
        '/fitur/peternak/ayam',
        '/fitur/peternak/sapi-potong',
        '/fitur/peternak/kambing-domba',
        '/harga',
        '/harga-pasar',
        '/market',
        '/tentang-kami',
        '/hubungi-kami',
        '/faq',
        '/blog',
        '/terms',
        '/privacy',
        '/blog/cara-hitung-fcr-ayam-broiler',
        '/blog/cara-hitung-indeks-performa-ayam-broiler',
        '/blog/cara-mengurangi-angka-kematian-ayam-broiler',
        '/blog/tips-manajemen-kandang-ayam-broiler-pemula',
        '/blog/cara-hitung-keuntungan-peternak-ayam-broiler',
        '/blog/cara-hitung-adg-sapi-potong-fattening',
        '/blog/cara-mengelola-batch-fattening-kambing-domba',
        '/_spa_fallback',
      ]
    },
    onFinished() {
      try {
        const fallbackPath = path.resolve(__dirname, 'dist/_spa_fallback/index.html');
        const destPath = path.resolve(__dirname, 'dist/200.html');
        if (fs.existsSync(fallbackPath)) {
          fs.copyFileSync(fallbackPath, destPath);
          fs.rmSync(path.resolve(__dirname, 'dist/_spa_fallback'), { recursive: true, force: true });
          console.log('✅ SPA Fallback (200.html) created successfully.');
        }
      } catch (err) {
        console.error('Error creating SPA fallback:', err);
      }
      // Fallback manifest for stale-cached clients that reference manifest-undefined.json
      try {
        const undefinedManifest = path.resolve(__dirname, 'dist/static-loader-data-manifest-undefined.json');
        if (!fs.existsSync(undefinedManifest)) {
          fs.writeFileSync(undefinedManifest, '{}');
          console.log('✅ Stale manifest fallback created.');
        }
      } catch (err) {
        console.error('Error creating stale manifest fallback:', err);
      }
      console.log('SSG Prerendering finished.')
    },
  },
})
