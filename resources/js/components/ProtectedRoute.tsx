import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    console.log('PROTECTED ROUTE ESTADO:', { isLoading, isAuthenticated });

    // 1. Si está cargando, no renderizar nada (AuthProvider ya muestra pantalla de carga)
    if (isLoading) {
        return <h1>CARGANDO SEGURIDAD...</h1>;
    }

    // 2. Si no está autenticado después de la verificación, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si está autenticado, permitir acceso
    return <Outlet />;
}
