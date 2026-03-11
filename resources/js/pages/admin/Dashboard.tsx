import React from 'react';
import { Users, BookOpen, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboard() {
    const { user } = useAuth();

    const stats = [
        {
            name: 'Gestión Usuarios', icon: Users, href: '/admin/users', color: 'text-blue-500', bg: 'bg-blue-500/10',
        },
        {
            name: 'Gestión Cartas', icon: BookOpen, href: '/admin/cards', color: 'text-emerald-500', bg: 'bg-emerald-500/10',
        },
        {
            name: 'Gestión Sets', icon: Layers, href: '/admin/sets', color: 'text-purple-500', bg: 'bg-purple-500/10',
        },
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto w-full">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Bienvenido,
                {' '}
                {user?.name}
            </h1>
            <p className="text-zinc-400 mb-8">
                Desde aquí puedes administrar Usuarios, Cartas y Expansiones.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Link
                        key={stat.name}
                        to={stat.href}
                        className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800/50 hover:bg-zinc-800/80 transition-all group relative overflow-hidden"
                    >
                        <div className={`absolute top-0 right-0 w-32 h-32 transform translate-x-12 -translate-y-12 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity ${stat.bg}`} />

                        <div className={`p-4 rounded-xl inline-flex mb-4 ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-100 mb-1">{stat.name}</h3>
                        <p className="text-sm text-zinc-500">Haz clic para administrar</p>
                    </Link>
                ))}
            </div>
        </div>
    );
}
