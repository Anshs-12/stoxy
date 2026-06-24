import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const BACKEND = 'https://stoxy-finance.onrender.com';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
  server: {
    proxy: {
      '/api/v2': {
        target: BACKEND,
        changeOrigin: true,
        secure: true,
        // Forward cookies for JWT authentication
        cookieDomainRewrite: 'localhost',
      },
    },
  },
});
