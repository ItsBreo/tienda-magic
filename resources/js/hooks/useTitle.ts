import { useEffect } from 'react';

/**
 * Hook para manejar el título de la página de forma dinámica.
 * @param title - El nombre de la sección actual (ej: 'Login')
 */
export function useTitle(title?: string) {
  useEffect(() => {
    const baseTitle = 'Black Lotus';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
    
    // Opcional: restaurar el título original al desmontar si es necesario
    // Pero en una SPA lo normal es que el siguiente componente lo pise
  }, [title]);
}
