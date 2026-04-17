import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Loader2, Database, User, Globe, Monitor, Search, Clock, Info,
} from 'lucide-react';
import apiService from '@/services/ApiService';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminPagination from '@/components/admin/AdminPagination';

interface AuditLog {
    id: number;
    user_id: number | null;
    action: string;
    target_id: number | null;
    target_type: string | null;
    payload: any;
    ip_address: string | null;
    user_agent: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        username: string;
    } | null;
}

export default function AuditLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');

    const fetchLogs = async (page = 1) => {
        try {
            setLoading(true);
            const response = await apiService.axiosInstance.get('/api/admin/logs', {
                params: {
                    page,
                    action: actionFilter,
                    search: searchTerm,
                },
            });
            setLogs(response.data.data);
            setLastPage(response.data.last_page);
            setCurrentPage(response.data.current_page);
        } catch (error) {
            toast.error('Error al cargar los archivos de la ciudadela');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(currentPage);
    }, [currentPage, actionFilter]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchLogs(1);
    };

    const getActionColor = (action: string) => {
        if (action.includes('auth')) return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (action.includes('shop')) return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (action.includes('market')) return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (action.includes('forum')) return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    };

    if (loading && currentPage === 1) {
        return (
            <div className="p-20 flex flex-col items-center justify-center gap-4">
                <Loader2 className="animate-spin text-primary w-10 h-10" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Consultando los Archivos...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Archivos de la Ciudadela</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Historial completo de acciones, eventos y transacciones del sistema.</p>
                </div>

                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
                        <Input
                            placeholder="Buscar acción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-card border-border/50 h-11 rounded-xl text-xs font-medium"
                        />
                    </div>
                    <select
                        value={actionFilter}
                        onChange={(e) => setActionFilter(e.target.value)}
                        className="bg-card border border-border/50 rounded-xl px-4 h-11 text-[10px] font-black uppercase tracking-widest text-muted-foreground outline-none focus:ring-1 focus:ring-primary transition-all appearance-none pr-8 cursor-pointer shadow-sm"
                    >
                        <option value="">Todas las acciones</option>
                        <option value="auth">Autenticación</option>
                        <option value="shop">Tienda</option>
                        <option value="market">Mercado</option>
                        <option value="forum">Foro</option>
                    </select>
                </form>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground font-literata">
                        <thead className="bg-accent/40 border-b border-border text-[9px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/60">
                            <tr>
                                <th className="px-6 py-6 font-black">Sello Temporal</th>
                                <th className="px-6 py-6 font-black">Iniciador</th>
                                <th className="px-6 py-6 font-black">Acción</th>
                                <th className="px-6 py-6 font-black">Detalles</th>
                                <th className="px-6 py-6 font-black">Origen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {logs.length > 0 ? logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-accent/20 transition-all duration-300">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-black text-[13px] whitespace-nowrap">
                                                {new Date(log.created_at).toLocaleDateString('es-ES')}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground/50 font-black font-montserrat flex items-center gap-1">
                                                <Clock size={10} />
                                                {new Date(log.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-lg bg-accent border border-border/50 flex items-center justify-center">
                                                <User size={12} className={log.user ? 'text-primary' : 'text-muted-foreground/30'} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-black text-[14px]">
                                                    {log.user ? log.user.name : 'Sistema / Huésped'}
                                                </span>
                                                {log.user && (
                                                    <span className="text-[9px] text-muted-foreground/50 uppercase font-black tracking-widest font-montserrat">
                                                        @
{log.user.username}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <Badge
variant="outline"
className={cn(
                                            'text-[8px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg border',
                                            getActionColor(log.action),
                                        )}>
                                            {log.action.replace('.', ': ')}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="max-w-xs xl:max-w-md">
                                            {log.payload ? (
                                                <div className="flex flex-col gap-1">
                                                    {Object.entries(log.payload).map(([key, value]) => (
                                                        <div key={key} className="flex gap-2">
                                                            <span className="text-[9px] font-black uppercase text-muted-foreground/40">
{key}
:
</span>
                                                            <span className="text-[11px] text-foreground font-medium truncate">
                                                                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] italic text-muted-foreground/30 font-medium tracking-tight opacity-50">Sin metadatos adicionales</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <div className="flex items-center gap-1.5 text-[10px] font-black font-montserrat text-zinc-500">
                                                <Globe size={10} />
                                                {log.ip_address || '---'}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[9px] font-medium text-muted-foreground/60 truncate max-w-[120px]" title={log.user_agent || ''}>
                                                <Monitor size={10} className="shrink-0" />
                                                {log.user_agent ? (log.user_agent.split(' ')[0]) : 'Desconocido'}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center opacity-20">
                                            <Database size={48} strokeWidth={1} className="mb-4" />
                                            <p className="font-black uppercase tracking-[0.4em] text-xs">No se han hallado registros</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

            <AdminPagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={setCurrentPage}
            />
            </div>

            <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
                <Info size={14} />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Los registros son inmutables y se conservan para auditoría permanente.</p>
            </div>
        </div>
    );
}
