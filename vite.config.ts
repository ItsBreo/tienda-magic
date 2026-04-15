import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// Check if we're in a Docker build environment (production)
const isDockerBuild = process.env.NODE_ENV === 'production' || process.env.DOCKER_BUILD === 'true';

const plugins = [
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
];

// Only add wayfinder plugin in development (not in Docker builds)
if (!isDockerBuild) {
    plugins.push(
        wayfinder({
            formVariants: true,
        })
    );
}

export default defineConfig({
    plugins,
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
