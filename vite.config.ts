import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            refresh: true,
        }),
        react({
            babel: {
                plugins: ['babel-plugin-react-compiler'],
            },
        }),
        tailwindcss(),
        wayfinder({
            formVariants: true,
        }),
    ],
    server: {
        host: '127.0.0.1',
        hmr: {
            host: '127.0.0.1',
        },
    },
    resolve: {
        alias: {
            // Esto asegura que @ apunte siempre a la carpeta del proyecto, sea Windows o Linux
            '@': fileURLToPath(new URL('./resources/js', import.meta.url)),
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    build: {
        rollupOptions: {
            external: ['laravel-echo', 'pusher-js'],
        },
    },
});
