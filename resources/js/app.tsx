import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/AuthContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: async (name) => {
        const pages = import.meta.glob('./pages/**/*.tsx');

        // Convert dot notation to path
        const path = `./pages/${name.replace(/\./g, '/')}.tsx`;
        console.log('Looking for:', path);

        const page = pages[path] as () => Promise<{ default: React.ComponentType<any> }>;
        if (page) {
            console.log('Found page at:', path);
            const module = await page();
            return module.default;
        }

        throw new Error(`Page not found: ${name} -> ${path}`);
    },
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(
          <StrictMode>
            <AuthProvider>
              <App {...props} />
            </AuthProvider>
          </StrictMode>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
