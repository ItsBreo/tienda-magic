import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

export function ProtectedLayout() {
    const { isAuthenticated, isLoading } = useAuth();

    // 1. Mostrar spinner mientras verifica si hay sesión
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Spinner className="w-8 h-8 mx-auto mb-4 text-purple-600" />
                    <p className="text-muted-foreground">Cargando tu tienda...</p>
                </div>
            </div>
        );
    }

    // 2. Si NO está autenticado, lo echamos al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 3. Si ESTÁ autenticado, Outlet renderiza la ruta que el usuario pidió (dashboard, perfil, etc.)
    return <Outlet />;
}
