import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function AdminRoute() {
    const { user, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-black">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.is_admin && !user?.permissions?.includes('view-admin-dashboard')) {
        // Si no es admin ni tiene permiso de ver dashboard, lo tiramos
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
