import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ProtectedLayout() {
    const { isAuthenticated, isLoading } = useAuth();


    // Si esta cargando, no renderizar nada (AuthProvider ya muestra pantalla de carga)
    if (isLoading) {
        return <h1>CARGANDO SEGURIDAD...</h1>;
    }

    // Si no esta autenticado después de la verificación, redirigir al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si esta autenticado, permitir acceso
    return <Outlet />;
}
