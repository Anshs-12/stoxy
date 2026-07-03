import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({mode}) => {
    const env = loadEnv(mode, process.cwd(), '');
    const BACKEND = env.VITE_BACKEND_URL ?? 'http://localhost:8080';

    return {
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
                    ws: true,          // proxy WebSocket upgrades (required for /api/v2/wss/market)
                    secure: BACKEND.startsWith('https'),
                    cookieDomainRewrite: 'localhost',
                },
            },
        },
    };
});