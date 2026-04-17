import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle, CheckCircle,
} from 'lucide-react';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CardSet {
    code: string;
    name: string;
    released_at: string;
    card_count: number;
    icon_svg_uri: string;
    is_active: boolean;
}

export default function AdminSets() {
    const [sets, setSets] = useState<CardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCode, setEditingCode] = useState<string | null>(null);

    const [form, setForm] = useState({
        code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '', is_active: true,
    });

    const selectableSets = sets.map((s) => ({ ...s, id: s.code }));

    const {
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected,
    } = useSelection(selectableSets);

    const fetchSets = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/sets');
            setSets(data.data || data);
        } catch (error) {
            toast.error('Error al cargar sets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSets();
    }, []);

    const handleDelete = async (code: string) => {
        if (!window.confirm(`¿Seguro que deseas eliminar el set ${code}?`)) return;
        try {
            await apiService.axiosInstance.delete(`/api/admin/sets/${code}`);
            toast.success('Set eliminado');
            fetchSets();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (set: CardSet) => {
        try {
            await apiService.updateAdminSet(set.code, { is_active: !set.is_active });
            toast.success(`Set ${!set.is_active ? 'activado' : 'desactivado'}`);
            fetchSets();
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} sets?`)) return;
        try {
            await apiService.axiosInstance.post('/api/admin/sets/bulk-delete', { ids: selectedList });
            toast.success('Eliminación masiva completada');
            clear();
            fetchSets();
        } catch (error) {
            toast.error('Error al realizar borrado masivo');
        }
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/sets/bulk-toggle-active', {
                ids: selectedList,
                is_active: active,
            });
            toast.success(`${selectedCount} sets ${active ? 'activados' : 'desactivados'}`);
            clear();
            fetchSets();
        } catch (error) {
            toast.error('Error al cambiar estado masivo');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingCode) {
                await apiService.updateAdminSet(editingCode, form);
                toast.success('Set actualizado');
            } else {
                await apiService.axiosInstance.post('/api/admin/sets', form);
                toast.success('Set creado');
            }
            setShowForm(false);
            setEditingCode(null);
            setForm({
 code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '', is_active: true,
});
            fetchSets();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando set');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (set: CardSet) => {
        setEditingCode(set.code);
        setForm({
            code: set.code,
            name: set.name,
            released_at: set.released_at || '',
            card_count: set.card_count,
            icon_svg_uri: set.icon_svg_uri || '',
            is_active: set.is_active,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
return (
<div className="p-20 flex flex-col items-center justify-center gap-4">
<Loader2 className="animate-spin text-primary w-10 h-10" />
<p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Consultando Crónicas...</p>
</div>
);
}

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Biblioteca de Planos</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Gestión de expansiones y cronologías. Al cerrar un plano, sus cartas se desvanecen de la tienda.</p>
                </div>
                <Button onClick={() => { setShowForm(!showForm); if (showForm) setEditingCode(null); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cerrar' : 'Nuevas Crónicas'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-8 rounded-xl mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <h2 className="text-2xl font-forum font-black text-foreground mb-8">{editingCode ? 'Alterar Crónica de Expansión' : 'Registrar Nueva Expansión'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label htmlFor="code" className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Código del Plano (ej. ktk)</label>
                            <Input id="code" value={form.code} disabled={!!editingCode} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium uppercase" required maxLength={10} />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre del Plano</label>
                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="released_at" className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Fecha de Manifestación</label>
                            <Input id="released_at" type="date" value={form.released_at} onChange={(e) => setForm({ ...form, released_at: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium block w-full" />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="card_count" className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Cantidad de Hechizos</label>
                            <Input id="card_count" type="number" min="0" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: parseInt(e.target.value, 10) })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="flex items-center space-x-3 pt-6 ml-1 col-span-2">
                             <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer transition-all"
                             />
                             <label htmlFor="is_active" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">Plano Conectado (Visibilidad en cascada)</label>
                        </div>
                        <div className="md:col-span-2 flex gap-4 pt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                                {submitting ? 'Guardando...' : editingCode ? 'Actualizar Registros' : 'Guardar en Biblioteca'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingCode(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground font-literata">
                        <thead className="bg-accent/40 border-b border-border text-[9px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/60">
                            <tr>
                                <th className="px-8 py-6 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={selectAll}
                                        className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                    />
                                </th>
                                <th className="px-6 py-6 font-black w-24 text-center">Sigilo</th>
                                <th className="px-6 py-6 font-black">Cód.</th>
                                <th className="px-6 py-6 font-black">Expansión</th>
                                <th className="px-6 py-6 font-black text-center">Conexión</th>
                                <th className="px-6 py-6 font-black text-center">Hechizos</th>
                                <th className="px-8 py-6 font-black text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {sets.map((s) => (
                                <tr
key={s.code}
className={cn(
                                    'group hover:bg-accent/20 transition-all duration-300',
                                    isSelected(s.code) ? 'bg-primary/[0.03]' : '',
                                )}>
                                    <td className="px-8 py-6 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(s.code)}
                                            onChange={() => toggle(s.code)}
                                            className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-6 flex justify-center">
                                        {s.icon_svg_uri ? (
                                            <div className="h-10 w-10 rounded-xl bg-accent border border-border/50 flex items-center justify-center shadow-inner group-hover:border-primary/30 transition-colors">
                                                <img src={s.icon_svg_uri} alt={s.code} className="w-6 h-6 invert dark:invert-0 opacity-80 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        ) : (
                                            <div className="h-10 w-10 border border-dashed border-border/30 rounded-xl" />
                                        )}
                                    </td>
                                    <td className="px-6 py-6 font-black text-[12px] text-muted-foreground/40 font-montserrat uppercase">
#
{s.code}
</td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-black text-[16px] group-hover:text-primary transition-colors font-forum">{s.name}</span>
                                            <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest font-montserrat opacity-60">
Lanzado:
{s.released_at || 'Desconocida'}
</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button
                                            onClick={() => handleToggleActive(s)}
                                            className={cn(
                                                'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                                s.is_active
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-muted/10 text-muted-foreground/40 border border-border/50',
                                            )}
                                        >
                                            {s.is_active ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                                            {s.is_active ? 'Conectado' : 'Cerrado'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-6 text-center font-black text-[11px] text-muted-foreground/30 font-montserrat">{s.card_count}</td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(s)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-primary/10">
                                                <Edit2 size={15} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(s.code)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-destructive/10">
                                                <Trash2 size={15} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <BulkActionsToolbar
                count={selectedCount}
                onClear={clear}
                actions={[
                    ...(selectedCount === 1 ? [{
                        label: 'Alterar Crónica',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const setToEdit = sets.find((s) => s.code === selectedList[0]);
                            if (setToEdit) handleEdit(setToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    {
                        label: 'Abrir Planos',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary',
                    },
                    {
                        label: 'Cerrar Planos',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground/60 hover:text-foreground',
                    },
                    {
                        label: 'Borrar Crónicas',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                        className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl',
                    },
                ]}
            />
        </div>
    );
}
