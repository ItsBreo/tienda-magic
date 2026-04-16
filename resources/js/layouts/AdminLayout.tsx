import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Users, BookOpen, Layers, LogOut, LayoutDashboard, Shield
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

/**
 * AdminLayout - Layout principal del panel de administración
 *
 * Proporciona:
 * - Sidebar con navegación entre secciones (Dashboard, Usuarios, Cartas, Sets)
 * - Información del usuario autenticado
 * - Botón de logout
 * - Área principal donde se renderiza el contenido según la ruta
 */
export default function AdminLayout() {
    // Obtener la función de logout y datos del usuario autenticado
    const { logout, user } = useAuth();

    // Hook para obtener la ubicación actual del navegador
    const location = useLocation();

    // Elementos de navegación del panel admin con íconos
    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Roles', href: '/admin/roles', icon: Shield },
        { name: 'Cartas', href: '/admin/cards', icon: BookOpen },
        { name: 'Sets', href: '/admin/sets', icon: Layers },
    ];

    // Verificar si una ruta está activa (para resaltar en el sidebar)
    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-background  text-foreground flex flex-col md:flex-row font-sans selection:bg-primary/30 transition-colors duration-300">
            {/* Sidebar - Barra de navegación lateral con opciones del admin */}
            <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col transition-colors duration-300">
                {/* Header del sidebar con logo y nombre */}
                <div className="h-16 flex items-center justify-between px-6 border-b border-border">
                    <div className="flex items-center">
                        <Layers className="h-6 w-6 text-primary mr-2" />
                        <span className="font-bold text-lg text-primary">
                            Admin Panel
                        </span>
                    </div>
                    {/* Añadimos el toggler de forma compacta (opcional si ya está pero le da un buen toque para probar en admin) */}
                    <div className="md:hidden">
                        <AnimatedThemeToggler className="h-6 w-6" />
                    </div>
                </div>

                {/* Menú de navegación - Se itera sobre los elementos definidos arriba */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            // Aplicar estilos diferentes si la ruta está activa o no
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                ? 'bg-primary/20 text-primary border border-primary/20'
                                : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Sección inferior - Información del usuario y botón de logout */}
                <div className="p-4 border-t border-border">
                    <div className="flex justify-center mb-4 hidden md:flex">
                        <AnimatedThemeToggler />
                    </div>

                    {/* Tarjeta del usuario actual */}
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-medium text-foreground truncate">{user?.name}</span>
                            <span className="text-xs text-muted-foreground">Super Admin</span>
                        </div>
                    </div>

                    {/* Botón de cerrar sesión */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                    </button>

                    {/* Enlace para volver a la tienda principal */}
                    <div className="mt-2 text-center w-full">
                        <Link to="/dashboard" className="text-xs text-muted-foreground hover:text-foreground underline">
                            Volver a Tienda
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Área principal - Contenido dinámico según la ruta actual */}
            <main className="flex-1 overflow-y-auto flex flex-col">
                {/* Los componentes de cada ruta se renderizarán aquí */}
                <Outlet />
            </main>
        </div>
    );
}
