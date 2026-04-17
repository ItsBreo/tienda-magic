import React from 'react';
import { Users, BookOpen, Layers, Package, Settings, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function AdminDashboard() {
    const { user } = useAuth();

    const stats = [
        {
            name: 'Gestión Usuarios', icon: Users, href: '/admin/users', color: 'text-blue-500', bg: 'bg-blue-500/10',
            desc: 'Administra cuentas, roles y permisos de acceso.'
        },
        {
            name: 'Gestión Cartas', icon: BookOpen, href: '/admin/cards', color: 'text-primary', bg: 'bg-primary/10',
            desc: 'Base de datos maestra de cartas de Magic.'
        },
        {
            name: 'Gestión Sets', icon: Layers, href: '/admin/sets', color: 'text-amber-500', bg: 'bg-amber-500/10',
            desc: 'Expansiones, fechas de lanzamiento y rarezas.'
        },
        {
            name: 'Gestión Sobres', icon: Package, href: '/admin/booster-packs', color: 'text-emerald-500', bg: 'bg-emerald-500/10',
            desc: 'Configuración de productos y precios en tienda.'
        },
        {
            name: 'Roles y RBAC', icon: Settings, href: '/admin/roles', color: 'text-purple-500', bg: 'bg-purple-500/10',
            desc: 'Control de acceso basado en roles del sistema.'
        },
        {
            name: 'Logs Sistema', icon: Database, href: '/admin/logs', color: 'text-zinc-500', bg: 'bg-zinc-500/10',
            desc: 'Historial de acciones y eventos del servidor.'
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="mb-10 text-center md:text-left">
                <h1 className="text-5xl font-forum font-black text-foreground mb-3 leading-tight">
                    Archivos de la <span className="text-primary italic">Ciudadela</span>
                </h1>
                <p className="text-[15px] text-muted-foreground/60 font-black uppercase tracking-[0.4em] font-montserrat">
                    Bienvenido de nuevo, Gran Archivero <span className="text-foreground">{user?.name}</span>
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Link
                        key={stat.name}
                        to={stat.href}
                        className="p-8 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-accent/40 hover:shadow-2xl hover:shadow-black/5 transition-all group relative overflow-hidden flex flex-col justify-between"
                    >
                        <div className={cn(
                            "absolute top-0 right-0 w-40 h-40 transform translate-x-16 -translate-y-16 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity",
                            stat.bg
                        )} />

                        <div>
                            <div className={cn(
                                "p-5 rounded-xl inline-flex mb-6 transition-transform group-hover:scale-110 duration-300 shadow-sm",
                                stat.bg,
                                stat.color
                            )}>
                                <stat.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-[10px] font-black font-montserrat uppercase tracking-[0.3em] text-muted-foreground/40 mb-2">{stat.name.split(' ')[0]}</h3>
                            <h3 className="text-2xl font-forum font-black text-foreground mb-3 group-hover:text-primary transition-colors">{stat.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed italic opacity-80">{stat.desc}</p>
                        </div>
                        
                        <div className="mt-8 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1">
                            Acceder al módulo <span>→</span>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="mt-12 p-6 rounded-xl border border-dashed border-border/50 bg-accent/5 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground">Sistema de administración v2.4.0 • Nodo Principal Operativo</p>
                </div>
                <div className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">the gathering origin project</div>
            </div>
        </div>
    );
}
