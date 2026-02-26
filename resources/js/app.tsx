import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { AuthProvider } from './contexts/AuthContext';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: (name) => {
    console.log('Looking for page:', name);

    // Convertir puntos a barras para que coincida con la estructura de archivos
    const path = `./pages/${name.replace(/\./g, '/')}.tsx`;
    console.log('Full path:', path);

    const result = resolvePageComponent(
      path,
      import.meta.glob('./pages/**/*.tsx'),
    );

    console.log('Result:', result);
    return result;
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
