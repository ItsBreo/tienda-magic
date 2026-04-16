import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

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
        code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '', is_active: true
    });

    // Adaptamos el tipo para useSelection que espera 'id'
    const selectableSets = sets.map(s => ({ ...s, id: s.code }));
    
    const {
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected
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
            const { data } = await apiService.axiosInstance.post('/api/admin/sets/bulk-delete', { ids: selectedList });
            toast.success(data.message);
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
                is_active: active
            });
            toast.success(`${selectedCount} sets ${active ? 'activados' : 'desactivadas'}`);
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
                code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '', is_active: true
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
            is_active: set.is_active
        });
        setShowForm(true);
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Sets (Expansiones)</h1>
                    <p className="text-sm text-muted-foreground">Si desactivas un Set, todas sus cartas se ocultarán automáticamente de la tienda.</p>
                </div>
                <Button onClick={() => { setShowForm(!showForm); if (showForm) setEditingCode(null); }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingCode ? 'Editando...' : 'Nuevo Set'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-6 rounded-xl mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-foreground mb-4">{editingCode ? 'Editar Set' : 'Crear Nuevo Set'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="code" className="text-xs text-muted-foreground">Código (ej. ktk)</label>
                            <Input id="code" value={form.code} disabled={!!editingCode} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} className="bg-accent border-border mt-1 uppercase" required maxLength={10} />
                        </div>
                        <div>
                            <label htmlFor="name" className="text-xs text-muted-foreground">Nombre del Set</label>
                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="released_at" className="text-xs text-muted-foreground">Fecha Lanzamiento</label>
                            <Input id="released_at" type="date" value={form.released_at} onChange={(e) => setForm({ ...form, released_at: e.target.value })} className="bg-accent border-border mt-1 block w-full" />
                        </div>
                        <div>
                            <label htmlFor="card_count" className="text-xs text-muted-foreground">Total Cartas</label>
                            <Input id="card_count" type="number" min="0" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: parseInt(e.target.value, 10) })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                             <input 
                                type="checkbox" 
                                id="is_active" 
                                checked={form.is_active} 
                                onChange={(e) => setForm({...form, is_active: e.target.checked})}
                                className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                             />
                             <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">Set Activo (Visibilidad en cascada)</label>
                        </div>
                        <div className="md:col-span-2 flex gap-3 mt-2">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                                {submitting ? 'Guardando...' : editingCode ? 'Actualizar Set' : 'Guardar Set'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingCode(null); }} className="flex-1 border-border text-muted-foreground hover:bg-accent">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-accent/40 border-b border-border text-xs uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4 font-medium w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={selectAll}
                                    className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 font-medium w-16 text-center">Icono</th>
                            <th className="px-6 py-4 font-medium">Cód.</th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium text-center">Estado</th>
                            <th className="px-6 py-4 font-medium">Cartas</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sets.map((s) => (
                            <tr key={s.code} className={`group hover:bg-accent/30 transition-all duration-300 ${isSelected(s.code) ? 'bg-primary/5' : ''}`}>
                                <td className="px-6 py-4 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isSelected(s.code)}
                                        onChange={() => toggle(s.code)}
                                        className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-4 flex justify-center">
                                    {s.icon_svg_uri && <img src={s.icon_svg_uri} alt={s.code} className="w-6 h-6 invert dark:invert-0 opacity-80" />}
                                </td>
                                <td className="px-6 py-4 font-mono text-foreground uppercase">{s.code}</td>
                                <td className="px-6 py-4 font-medium text-primary">{s.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleToggleActive(s)}
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                            s.is_active 
                                            ? 'bg-primary/10 text-primary border border-primary/20' 
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}
                                    >
                                        {s.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                        {s.is_active ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 font-mono">{s.card_count}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} className="text-muted-foreground hover:text-primary hover:bg-primary/10">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.code)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <BulkActionsToolbar
                count={selectedCount}
                onClear={clear}
                actions={[
                    ...(selectedCount === 1 ? [{
                        label: 'Editar',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const setToEdit = sets.find(s => s.code === selectedList[0]);
                            if (setToEdit) handleEdit(setToEdit);
                        },
                        className: 'text-primary hover:text-primary/80'
                    }] : []),
                    {
                        label: 'Activar',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary/80'
                    },
                    {
                        label: 'Desactivar',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground hover:text-foreground'
                    },
                    {
                        label: 'Eliminar',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                        className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border border-destructive/20'
                    }
                ]}
            />
        </div>
    );
}
