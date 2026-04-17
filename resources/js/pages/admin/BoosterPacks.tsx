import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle, Package, Sparkles,
} from 'lucide-react';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BoosterPack {
    id: number;
    name: string;
    price: number;
    card_set_id: string;
    type: string;
    image_uri: string | null;
    is_active: boolean;
    card_set?: {
        name: string;
    };
}

export default function AdminBoosterPacks() {
    const [packs, setPacks] = useState<BoosterPack[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [form, setForm] = useState({
        name: '',
        price: 0,
        card_set_id: '',
        type: 'booster',
        image_uri: '',
        is_active: true,
    });

    const {
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected,
    } = useSelection(packs);

    const fetchPacks = async () => {
        try {
            const data = await apiService.getAdminBoosterPacks();
            setPacks(data);
        } catch (error) {
            toast.error('Error al cargar sobres');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPacks();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro que deseas eliminar este sobre del inventario?')) return;
        try {
            await apiService.deleteBoosterPack(id);
            toast.success('Producto eliminado del catálogo');
            fetchPacks();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (pack: BoosterPack) => {
        try {
            await apiService.updateBoosterPack(pack.id, { is_active: !pack.is_active });
            toast.success(`Producto ${!pack.is_active ? 'activado' : 'desactivado'}`);
            fetchPacks();
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} sobres?`)) return;
        try {
            await apiService.axiosInstance.post('/api/admin/booster-packs/bulk-delete', { ids: selectedList });
            toast.success('Eliminación masiva completada');
            clear();
            fetchPacks();
        } catch (error) {
            toast.error('Error al realizar borrado masivo');
        }
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/booster-packs/bulk-toggle-active', {
                ids: selectedList,
                is_active: active,
            });
            toast.success(`${selectedCount} sobres ${active ? 'activados' : 'desactivados'}`);
            clear();
            fetchPacks();
        } catch (error) {
            toast.error('Error al cambiar estado masivo');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await apiService.updateBoosterPack(editingId, form);
                toast.success('Producto actualizado');
            } else {
                await apiService.createBoosterPack(form);
                toast.success('Nuevo sobre forjado');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({
 name: '', price: 0, card_set_id: '', type: 'booster', image_uri: '', is_active: true,
});
            fetchPacks();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al guardar');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (pack: BoosterPack) => {
        setEditingId(pack.id);
        setForm({
            name: pack.name,
            price: pack.price,
            card_set_id: pack.card_set_id,
            type: pack.type,
            image_uri: pack.image_uri || '',
            is_active: pack.is_active,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
return (
<div className="p-20 flex flex-col items-center justify-center gap-4">
<Loader2 className="animate-spin text-primary w-10 h-10" />
<p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Forjando Sobres...</p>
</div>
);
}

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Forja de Sobres</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Configuración de Booster Packs, precios y visibilidad en el mercado.</p>
                </div>
                <Button
onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) setEditingId(null);
                }}
className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Cerrar' : 'Forjar Sobre'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-8 rounded-xl mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <h2 className="text-2xl font-forum font-black text-foreground mb-8 flex items-center gap-3">
                        <Sparkles className="text-primary w-6 h-6" />
                        {editingId ? 'Alterar Esencia del Sobre' : 'Inscribir Nuevo Producto'}
                    </h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre Comercial</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Precio de Venta (Oro)</label>
                            <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Código del Plano (Set)</label>
                            <Input value={form.card_set_id} onChange={(e) => setForm({ ...form, card_set_id: e.target.value.toLowerCase() })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium uppercase" required placeholder="ej: ktk" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Categoría</label>
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full bg-accent/40 border border-border/50 rounded-xl px-4 h-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                                <option value="booster">Booster Pack</option>
                                <option value="starter_deck">Starter Deck</option>
                                <option value="bundle">Bundle Arcano</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Pergamino Visual (URL Imagen)</label>
                            <Input value={form.image_uri} onChange={(e) => setForm({ ...form, image_uri: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" />
                        </div>
                        <div className="flex items-center space-x-3 pt-6 ml-1">
                            <Checkbox
                                id="active-mode"
                                checked={form.is_active}
                                onCheckedChange={(val: boolean) => setForm({ ...form, is_active: val })}
                                className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary transition-all"
                            />
                            <label htmlFor="active-mode" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">
                                Manifestación Activa / Visible
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-4 pt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                                {submitting ? 'Forjando...' : editingId ? 'Actualizar Producto' : 'Guardar en Catálogo'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
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
                                <th className="px-6 py-6 font-black">Producto</th>
                                <th className="px-6 py-6 font-black text-center">Plano (Set)</th>
                                <th className="px-6 py-6 font-black text-center">Precio</th>
                                <th className="px-6 py-6 font-black text-center">Invocación</th>
                                <th className="px-8 py-6 font-black text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {packs.map((p) => (
                                <tr
key={p.id}
className={cn(
                                    'group hover:bg-accent/20 transition-all duration-300',
                                    isSelected(p.id) ? 'bg-primary/[0.03]' : '',
                                )}>
                                    <td className="px-8 py-6">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(p.id)}
                                            onChange={() => toggle(p.id)}
                                            className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="h-14 w-11 bg-accent border border-border/50 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner group-hover:border-primary/30 transition-colors">
                                                {p.image_uri ? (
                                                    <img src={p.image_uri} alt={p.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="p-2 opacity-20"><Package size={16} /></div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-black text-[16px] group-hover:text-primary transition-colors font-forum leading-tight">{p.name}</span>
                                                <span className="text-[10px] text-muted-foreground/40 font-black uppercase tracking-widest font-montserrat mt-1">{p.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg bg-accent/40 text-muted-foreground/60 border-border/30 font-montserrat">
                                            {p.card_set_id}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <span className="text-[15px] font-black text-primary font-forum">
{p.price.toFixed(2)}
{' '}
Oro
</span>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <button
                                            onClick={() => handleToggleActive(p)}
                                            className={cn(
                                                'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                                p.is_active
                                                ? 'bg-primary/10 text-primary border border-primary/20'
                                                : 'bg-muted/10 text-muted-foreground/40 border border-border/50',
                                            )}
                                        >
                                            {p.is_active ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                                            {p.is_active ? 'Disponible' : 'Agotado'}
                                        </button>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-primary/10">
                                                <Edit2 size={15} />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-destructive/10">
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
                        label: 'Alterar Producto',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const packToEdit = packs.find((p) => p.id === selectedList[0]);
                            if (packToEdit) handleEdit(packToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    {
                        label: 'Activar Oferta',
                        icon: <CheckCircle2 className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary',
                    },
                    {
                        label: 'Pausar Oferta',
                        icon: <XCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground/60 hover:text-foreground',
                    },
                    {
                        label: 'Eliminar Registros',
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
