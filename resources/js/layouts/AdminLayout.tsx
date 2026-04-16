import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Users, BookOpen, Layers, LogOut, LayoutDashboard, Shield, Package
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

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
        { name: 'Sobres', href: '/admin/booster-packs', icon: Package },
    ];

    // Verificar si una ruta está activa (para resaltar en el sidebar)
    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col md:flex-row font-sans selection:bg-emerald-500/30">
            {/* Sidebar - Barra de navegación lateral con opciones del admin */}
            <aside className="w-full md:w-64 bg-zinc-950 border-r border-zinc-800/50 flex flex-col">
                {/* Header del sidebar con logo y nombre */}
                <div className="h-16 flex items-center px-6 border-b border-zinc-800/50">
                    <Layers className="h-6 w-6 text-emerald-500 mr-2" />
                    <span className="font-bold text-lg bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        Admin Panel
                    </span>
                </div>

                {/* Menú de navegación - Se itera sobre los elementos definidos arriba */}
                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            // Aplicar estilos diferentes si la ruta está activa o no
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive(item.href)
                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20'
                                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-100'
                                }`}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    ))}
                </div>

                {/* Sección inferior - Información del usuario y botón de logout */}
                <div className="p-4 border-t border-zinc-800/50">
                    {/* Tarjeta del usuario actual */}
                    <div className="flex items-center gap-3 px-3 py-2 mb-2">
                        <div className="h-8 w-8 rounded-full bg-emerald-900/50 flex items-center justify-center text-emerald-500 font-bold border border-emerald-500/30">
                            {user?.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col truncate">
                            <span className="text-sm font-medium text-zinc-200 truncate">{user?.name}</span>
                            <span className="text-xs text-zinc-500">Super Admin</span>
                        </div>
                    </div>

                    {/* Botón de cerrar sesión */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-950/30 rounded-lg transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Cerrar Sesión
                    </button>

                    {/* Enlace para volver a la tienda principal */}
                    <div className="mt-2 text-center w-full">
                        <Link to="/dashboard" className="text-xs text-zinc-500 hover:text-zinc-300 underline">
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
