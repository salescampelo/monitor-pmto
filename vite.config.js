import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin que emula o comportamento da Vercel Function em dev:
// reescreve /api/data/<file> → /data/<file> (serve de public/data/)
const apiDataDevProxy = {
  name: 'api-data-dev-proxy',
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url?.startsWith('/api/data/')) {
        req.url = req.url.replace('/api/data/', '/data/');
      }
      next();
    });
  },
};

export default defineConfig({
  plugins: [
    react(),
    apiDataDevProxy,
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Monitor Coronel Barbosa',
        short_name: 'Monitor CB',
        description: 'Central de Inteligência Eleitoral - Tocantins 2026',
        theme_color: '#1A3A7A',
        background_color: '#F3F5F9',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            // Dados JSON — Stale While Revalidate (mostra cache, atualiza em bg)
            urlPattern: /\/api\/data\/.+\.json(\?.*)?$/,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'data-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24, // 24 horas
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Assets estáticos — Cache First (30 dias)
            urlPattern: /\.(?:js|css|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
  },
});
