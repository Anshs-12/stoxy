import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.VITE_BACKEND_URL ?? 'http://localhost:8080'
  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/v2': {
          target: backend,
          changeOrigin: true,
          ws: true,
          secure: backend.startsWith('https'),
          cookieDomainRewrite: 'localhost',
        },
      },
    },
  }
})
