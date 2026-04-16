import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import TiendaMagicLayout from '@/layouts/TiendaLayout';

import { useAchievementListener } from '@/hooks/useAchievementListener';

export function ProtectedLayout() {
    const { isAuthenticated, isLoading } = useAuth();
    
    // Escuchar logros en tiempo real (solo si está autenticado el hook internamente lo maneja)
    useAchievementListener();

    // Si está cargando, no renderizar nada (AuthProvider ya muestra pantalla de carga)
    if (isLoading) {
        return <h1>CARGANDO SEGURIDAD...</h1>;
    }

    // Si no está autenticado después de la verificación, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, renderizar con TiendaMagicLayout que incluye el Navbar
    return (
        <TiendaMagicLayout>
            <Outlet />
        </TiendaMagicLayout>
    );
}
