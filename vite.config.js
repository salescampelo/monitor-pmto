import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
  plugins: [react(), apiDataDevProxy],
});
