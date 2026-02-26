import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { router } from '@inertiajs/react';
import { Spinner } from '@/components/ui/spinner';

interface ProtectedRouteProps {
    children: React.ReactNode;
    redirectTo?: string;
    requireAuth?: boolean;
}

export function ProtectedRoute({ 
    children, 
    redirectTo = '/login', 
    requireAuth = true 
}: ProtectedRouteProps) {
    const { isAuthenticated, isLoading } = useAuth();

    // Mostrar spinner mientras verifica autenticación
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <Spinner className="w-8 h-8 mx-auto mb-4" />
                    <p className="text-muted-foreground">Verificando autenticación...</p>
                </div>
            </div>
        );
    }

    // Si requiere autenticación y no está autenticado, redirigir
    if (requireAuth && !isAuthenticated) {
        router.visit(redirectTo);
        return null;
    }

    // Si no requiere autenticación y está autenticado, redirigir al dashboard
    if (!requireAuth && isAuthenticated) {
        router.visit('/dashboard');
        return null;
    }

    // En todos los demás casos, mostrar los children
    return <>{children}</>;
}

// Componente para rutas que solo deben ser accesibles si NO está autenticado
export function GuestRoute({ children, redirectTo = '/dashboard' }: Omit<ProtectedRouteProps, 'requireAuth'>) {
    return <ProtectedRoute requireAuth={false} redirectTo={redirectTo}>{children}</ProtectedRoute>;
}
