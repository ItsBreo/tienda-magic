import React, { useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Users, BookOpen, Layers, LogOut, LayoutDashboard, Shield, Package,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { UserAvatar } from '@/components/common/UserAvatar';

const NAV_HEIGHT = 80; // Altura aproximada del Navbar principal (py-5 + contenido)

export default function AdminLayout() {
    const { logout, user } = useAuth();
    const location = useLocation();

    // Bloquear el scroll del body mientras estamos en admin.
    // El scroll pasa sólo dentro del <main> de abajo, lo que mantiene
    // el sidebar completamente inmóvil sin necesitar fixed ni sticky.
    useEffect(() => {
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, []);

    const navigation = [
        { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
        { name: 'Usuarios', href: '/admin/users', icon: Users },
        { name: 'Roles', href: '/admin/roles', icon: Shield },
        { name: 'Cartas', href: '/admin/cards', icon: BookOpen },
        { name: 'Sets', href: '/admin/sets', icon: Layers },
        { name: 'Sobres', href: '/admin/booster-packs', icon: Package },
    ];

    const isActive = (path: string) => {
        if (path === '/admin') return location.pathname === '/admin';
        return location.pathname.startsWith(path);
    };

    return (
        /*
         * Contenedor de altura fija = viewport - navbar.
         * Al no haber scroll en el body, el sidebar no se mueve.
         * Solo el <main> de dentro tiene overflow-y-auto para scrollear contenido.
         */
        <div
            className="flex w-full relative z-10"
            style={{ height: `calc(100vh - ${NAV_HEIGHT}px)` }}
        >
            {/* ── Sidebar ── */}
            <aside className="w-64 flex-shrink-0 bg-card/60 backdrop-blur-md border-r border-border flex flex-col">

                {/* Navigation — scrollable internamente si hay muchos links */}
                <nav className="flex-1 min-h-0 overflow-y-auto px-4 py-5 space-y-0.5">
                    {navigation.map((item) => (
                        <Link
                            key={item.name}
                            to={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 ${
                                isActive(item.href)
                                    ? 'bg-primary/10 text-primary border border-primary/20 font-black shadow-sm'
                                    : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent font-medium'
                            }`}
                        >
                            <item.icon className="h-4 w-4 flex-shrink-0" />
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Bottom — SIEMPRE al fondo, nunca se mueve */}
                <div className="p-4 border-t border-border flex-shrink-0 space-y-2">
                    {/* User card */}
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-accent/30 border border-border/50">
                        <UserAvatar 
                            src={user?.avatar_url}
                            name={user?.name}
                            className="h-8 w-8 rounded-lg bg-primary/20 border border-primary/30 flex-shrink-0"
                            fallbackClassName="text-primary font-black text-sm"
                        />
                        <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black uppercase tracking-widest text-foreground truncate">{user?.name}</span>
                            <span className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{user?.role_name ?? 'Admin'}</span>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors border border-transparent hover:border-destructive/10"
                    >
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        Cerrar Sesión
                    </button>

                    {/* Back to store */}
                    <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-center px-3 py-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded-xl"
                    >
                        ← Volver a Tienda
                    </Link>
                </div>
            </aside>

            {/* ── Main content — SOLO este área hace scroll ── */}
            <main className="flex-1 overflow-y-auto flex flex-col min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
