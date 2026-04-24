import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Plus, Loader2, Edit2, CheckCircle2, XCircle, CheckCircle,
    ChevronUp, ChevronDown, ArrowUpDown,
} from 'lucide-react';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import AdminPagination from '@/components/admin/AdminPagination';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { formatDateShort } from '@/utils/formatDateShort';

interface CardSet {
    code: string;
    name: string;
    released_at: string;
    card_count: number;
    icon_svg_uri: string;
    is_active: boolean;
    deleted_at: string | null;
}

export default function AdminSets() {
    const [sets, setSets] = useState<CardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingCode, setEditingCode] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        onConfirm: () => {}
    });

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

    const fetchSets = async (page = 1) => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/sets', {
                params: {
                    page,
                    sort_by: sortBy,
                    sort_dir: sortDir
                }
            });
            setSets(data.data || data);
            if (data.current_page) {
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
            }
        } catch (error) {
            toast.error('Error al cargar sets');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    useEffect(() => {
        fetchSets(currentPage);
    }, [currentPage, sortBy, sortDir]);

    const handleDelete = (code: string) => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas exiliar el set ${code}?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.delete(`/api/admin/sets/${code}`);
                    toast.success('Set exiliado');
                    fetchSets(currentPage);
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Error al exiliar');
                }
            }
        });
    };

    const handleRestore = async (code: string) => {
        try {
            await apiService.axiosInstance.post(`/api/admin/sets/${code}/restore`);
            toast.success('Set restaurado exitosamente');
            fetchSets(currentPage);
        } catch (error: any) {
            toast.error('Error al restaurar set');
        }
    };

    const handleToggleActive = async (set: CardSet) => {
        try {
            await apiService.updateAdminSet(set.code, { is_active: !set.is_active });
            toast.success(`Set ${!set.is_active ? 'activado' : 'desactivado'}`);
            fetchSets(currentPage);
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleBulkDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas exiliar ${selectedCount} sets?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/sets/bulk-delete', { ids: selectedList });
                    toast.success('Sets exiliados correctamente');
                    clear();
                    fetchSets(currentPage);
                } catch (error) {
                    toast.error('Error al realizar exilio masivo');
                }
            }
        });
    };

    const handleBulkRestore = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Deseas restaurar ${selectedCount} sets exiliados?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/sets/bulk-restore', { ids: selectedList });
                    toast.success('Restauración masiva completada');
                    clear();
                    fetchSets(currentPage);
                } catch (error) {
                    toast.error('Error al restaurar sets');
                }
            }
        });
    };

    // Helper functions to determine selection state
    const getSelectedSets = () => {
        return sets.filter(set => selectedList.includes(set.code));
    };

    const areAllSelectedAlive = () => {
        const selectedSets = getSelectedSets();
        return selectedSets.length > 0 && selectedSets.every(set => set.deleted_at === null);
    };

    const areAllSelectedExiled = () => {
        const selectedSets = getSelectedSets();
        return selectedSets.length > 0 && selectedSets.every(set => set.deleted_at !== null);
    };

    const hasMixedSelection = () => {
        const selectedSets = getSelectedSets();
        return selectedSets.length > 0 && !areAllSelectedAlive() && !areAllSelectedExiled();
    };

    // Solo permite hard delete si todos los seleccionados están exiliados (soft deleted)
    const canHardDelete = areAllSelectedExiled();

    const handleBulkForceDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿ELIMINAR DEFINITIVAMENTE ${selectedCount} SETS? Esta acción es irreversible.`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/sets/bulk-force-delete', { ids: selectedList });
                    toast.success('Eliminación definitiva completada');
                    clear();
                    fetchSets(currentPage);
                } catch (error) {
                    toast.error('Error al eliminar permanentemente');
                }
            }
        });
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/sets/bulk-toggle-active', {
                ids: selectedList,
                is_active: active,
            });
            toast.success(`${selectedCount} sets ${active ? 'activados' : 'desactivados'}`);
            clear();
            fetchSets(currentPage);
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
            fetchSets(currentPage);
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
                <div className="flex gap-4">
                    <Button
                        onClick={() => {
                            setEditingCode(null);
                            setForm({
                                code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '', is_active: true,
                            });
                            setShowForm(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Set
                    </Button>
                </div>
            </div>

            {/* Modal de Adición/Edición de Set */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                        <h2 className="text-2xl font-forum font-black text-foreground mb-8">{editingCode ? 'Alterar Crónicas del Plano' : 'Registrar Nuevo Plano (Set)'}</h2>
                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Código del Plano (3 letras)</label>
                                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} disabled={!!editingCode} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre del Plano</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Fecha de Manifestación (Lanzamiento)</label>
                                <Input type="date" value={form.released_at} onChange={(e) => setForm({ ...form, released_at: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Total de Hechizos (Cartas)</label>
                                <Input type="number" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: parseInt(e.target.value) || 0 })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Icono de la Expansión (URL SVG)</label>
                                <Input value={form.icon_svg_uri} onChange={(e) => setForm({ ...form, icon_svg_uri: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" />
                            </div>
                            <div className="flex items-center space-x-3 pt-6 ml-1">
                                 <input
                                    type="checkbox"
                                    id="set_active"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer transition-all"
                                />
                                <label htmlFor="set_active" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">
                                    Plano Accesible / Activo
                                </label>
                            </div>
                            <div className="md:col-span-2 flex gap-4 pt-4">
                                <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 font-montserrat">
                                    {submitting ? 'Inscribiendo...' : editingCode ? 'Actualizar Plano' : 'Registrar Plano'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingCode(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </div>
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
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('code')}>
                                    <div className="flex items-center gap-1">
                                        Cód.
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'code' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Plano
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'name' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black text-center cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('released_at')}>
                                    <div className="flex items-center gap-1 justify-center">
                                        Manifestación
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'released_at' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black text-center cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('is_active')}>
                                    <div className="flex items-center gap-1 justify-center">
                                        Estado
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'is_active' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black text-center">Invocaciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {sets.map((s) => (
                                <tr
                                    key={s.code}
                                    className={cn(
                                        'group hover:bg-accent/20 transition-all duration-300',
                                        isSelected(s.code) ? 'bg-primary/[0.03]' : '',
                                    )}
                                >
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
                                        # {s.code}
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-foreground font-black text-[16px] group-hover:text-primary transition-colors font-forum">{s.name}</span>
                                            <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest font-montserrat opacity-60">
                                                Lanzado: {s.released_at ? formatDateShort(s.released_at) : 'Desconocida'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        {s.deleted_at ? (
                                            <Badge
                                                variant="outline"
                                                className="text-[8px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg bg-destructive/10 text-destructive border-destructive/20"
                                            >
                                                Exiliado
                                            </Badge>
                                        ) : (
                                            <button
                                                onClick={() => handleToggleActive(s)}
                                                className={cn(
                                                    'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                                    s.is_active
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'bg-warning/10 text-warning-600 border border-warning/20',
                                                )}
                                            >
                                                {s.is_active ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                                                {s.is_active ? 'Conectado' : 'Cerrado'}
                                            </button>
                                        )}
                                    </td>
                                    <td className="px-6 py-6 text-center font-black text-[11px] text-muted-foreground/30 font-montserrat">{s.card_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <AdminPagination
                currentPage={currentPage}
                lastPage={lastPage}
                onPageChange={setCurrentPage}
            />

            <BulkActionsToolbar
                count={selectedCount}
                onClear={clear}
                actions={[
                    ...(selectedCount === 1 && !hasMixedSelection() ? [{
                        label: 'Editar',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const setToEdit = sets.find((s) => s.code === selectedList[0]);
                            if (setToEdit) handleEdit(setToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    ...(areAllSelectedAlive() ? [
                        {
                            label: 'Exiliar',
                            icon: <XCircle className="w-4 h-4" />,
                            onClick: handleBulkDelete,
                            className: 'text-warning-600 hover:text-warning-700',
                        },
                    ] : []),
                    ...(areAllSelectedExiled() ? [
                        {
                            label: 'Restaurar',
                            icon: <CheckCircle2 className="w-4 h-4" />,
                            onClick: handleBulkRestore,
                            className: 'text-green-600 hover:text-green-700',
                        },
                        {
                            label: 'Borrar Definitivamente',
                            icon: <Plus className="w-4 h-4 rotate-45" />,
                            onClick: handleBulkForceDelete,
                            className: 'text-destructive hover:text-destructive',
                        },
                    ] : []),
                    ...(hasMixedSelection() ? [{
                        label: 'Selección mixta - no se pueden aplicar acciones',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {},
                        className: 'text-muted-foreground/40 cursor-not-allowed',
                    }] : []),
                ]}
            />

            <ConfirmModal
                isOpen={confirmModalConfig.isOpen}
                onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModalConfig.onConfirm}
                title={confirmModalConfig.title}
            />
        </div>
    );
}
