import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Plus, Loader2, Edit2, CheckCircle2, XCircle, AlertTriangle, CheckCircle, XCircle as XIcon, Search,
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
interface Card {
    id: number;
    name: string;
    set_code: string;
    scryfall_id: string;
    rarity: string;
    price_usd: number;
    is_active: boolean;
    deleted_at: string | null;
    card_set?: {
        is_active: boolean;
    };
}

export default function AdminCards() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [confirmModalConfig, setConfirmModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        onConfirm: () => {}
    });

    const {
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected,
    } = useSelection(cards);

    const [form, setForm] = useState({
        scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0, is_active: true,
    });

    useEffect(() => {
        fetchCards(currentPage);
    }, [currentPage]);

    const fetchCards = async (page = 1) => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/cards', {
                params: { page }
            });
            // Handle both paginated and non-paginated responses for safety
            setCards(data.data || data);
            if (data.current_page) {
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
            }
        } catch (error) {
            toast.error('Error al cargar cartas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModalConfig({
            isOpen: true,
            title: '¿Seguro que deseas exiliar esta carta de la colección?',
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.delete(`/api/admin/cards/${id}`);
                    toast.success('Carta exiliada de los registros');
                    fetchCards(currentPage);
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Error al exiliar');
                }
            }
        });
    };

    const handleRestore = async (id: number) => {
        try {
            await apiService.axiosInstance.post(`/api/admin/cards/${id}/restore`);
            toast.success('Carta restaurada exitosamente');
            fetchCards(currentPage);
        } catch (error: any) {
            toast.error('Error al restaurar carta');
        }
    };


    const handleToggleActive = async (card: Card) => {
        try {
            await apiService.updateAdminCard(card.id, { is_active: !card.is_active });
            toast.success(`Carta ${!card.is_active ? 'activada' : 'desactivada'}`);
            fetchCards(currentPage);
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleBulkDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas eliminar ${selectedCount} cartas?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/cards/bulk-delete', { ids: selectedList });
                    toast.success('Eliminación masiva completada');
                    clear();
                    fetchCards();
                } catch (error) {
                    toast.error('Error al realizar borrado masivo');
                }
            }
        });
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/cards/bulk-toggle-active', {
                ids: selectedList,
                is_active: active,
            });
            toast.success(`${selectedCount} cartas ${active ? 'activadas' : 'desactivadas'}`);
            clear();
            fetchCards();
        } catch (error) {
            toast.error('Error al cambiar estado masivo');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await apiService.updateAdminCard(editingId, form);
                toast.success('Atributos de la carta actualizados');
            } else {
                await apiService.axiosInstance.post('/api/admin/cards', form);
                toast.success('Nueva carta registrada');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({
 scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0, is_active: true,
});
            fetchCards();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando carta');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (card: Card) => {
        setEditingId(card.id);
        setForm({
            name: card.name,
            set_code: card.set_code,
            scryfall_id: card.scryfall_id,
            collector_number: '',
            rarity: card.rarity,
            mana_value: 0,
            price_usd: card.price_usd || 0,
            is_active: card.is_active,
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
return (
<div className="p-20 flex flex-col items-center justify-center gap-4">
<Loader2 className="animate-spin text-primary w-10 h-10" />
<p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Invocando el Grimorio...</p>
</div>
);
}

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Grimorio Arcano</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Base de datos maestra de hechizos y criaturas disponibles en la tienda.</p>
                </div>
                <div className="flex gap-4">
                    <Button
onClick={() => {
                        setEditingId(null);
                        setForm({
 scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0, is_active: true,
});
                        setShowForm(!showForm);
                    }}
className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                        <Plus className="w-4 h-4 mr-2" />
                        {showForm ? 'Cerrar' : 'Nueva Carta'}
                    </Button>
                </div>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-8 rounded-xl mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                    <h2 className="text-2xl font-forum font-black text-foreground mb-8">{editingId ? 'Alterar Pergamino de Carta' : 'Inscribir Nueva Carta'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre del Hechizo</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                             <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Rareza del Cristal</label>
                            <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="w-full bg-accent/40 border border-border/50 rounded-xl px-4 h-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                                <option value="common">Común</option>
                                <option value="uncommon">Infrecuente</option>
                                <option value="rare">Rara</option>
                                <option value="mythic">Mítica</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-3 pt-6 ml-1">
                             <input
                                type="checkbox"
                                id="card_active"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer transition-all"
                             />
                             <label htmlFor="card_active" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">Manifestación Activa</label>
                        </div>
                        <div className="md:col-span-3 flex gap-4 pt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 font-montserrat">
                                {submitting ? 'Inscribiendo...' : editingId ? 'Confirmar Alteración' : 'Inscribir en Grimorio'}
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
                                <th className="px-6 py-6 font-black">Hechizo / Identidad</th>
                                <th className="px-6 py-6 font-black text-center">Expansión</th>
                                <th className="px-6 py-6 font-black text-center">Manifestación</th>
                                <th className="px-6 py-6 font-black text-center">Rareza</th>
                                <th className="px-8 py-6 font-black text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {cards.map((c) => {
                                const isSetInactive = c.card_set && !c.card_set.is_active;
                                return (
                                    <tr
key={c.id}
className={cn(
                                        'group hover:bg-accent/20 transition-all duration-300',
                                        isSelected(c.id) ? 'bg-primary/[0.03]' : '',
                                    )}>
                                        <td className="px-8 py-6">
                                            <input
                                                type="checkbox"
                                                checked={isSelected(c.id)}
                                                onChange={() => toggle(c.id)}
                                                className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                            />
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-black text-[16px] group-hover:text-primary transition-colors font-forum">{c.name}</span>
                                                {isSetInactive && (
                                                    <span className="text-[9px] text-destructive font-black uppercase tracking-widest flex items-center gap-1 mt-1 opacity-70">
                                                        <AlertTriangle className="w-3 h-3" />
{' '}
Plano Inaccesible
</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg bg-accent/40 text-muted-foreground/60 border-border/30 font-montserrat">
                                                {c.set_code}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <button
                                                onClick={() => handleToggleActive(c)}
                                                className={cn(
                                                    'inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all',
                                                    c.is_active
                                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                                    : 'bg-muted/10 text-muted-foreground/40 border border-border/50',
                                                )}
                                            >
                                                {c.is_active ? <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> : <XCircle className="w-3.5 h-3.5 mr-1.5" />}
                                                {c.is_active ? 'Visible' : 'Oculta'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <span className={cn(
                                                'text-[10px] font-black uppercase tracking-[0.2em] font-montserrat',
                                                c.rarity === 'mythic' ? 'text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.3)]'
                                                : c.rarity === 'rare' ? 'text-amber-400'
                                                : c.rarity === 'uncommon' ? 'text-slate-300 opacity-60'
                                                : 'text-muted-foreground/40',
                                            )}>
                                                {c.rarity}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-primary/10">
                                                    <Edit2 size={15} />
                                                </Button>
                                                {!c.deleted_at ? (
                                                // Carta ACTIVA (no exiliada)
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-muted-foreground hover:text-warning-600 hover:bg-warning-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-warning-20" title="Exiliar carta">
                                                    <XCircle size={15} />
                                                </Button>
                                            ) : (
                                                // Carta EXILIADA (soft deleted)
                                                <Button variant="ghost" size="icon" onClick={() => handleRestore(c.id)} className="text-muted-foreground hover:text-green-600 hover:bg-green-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-green-20" title="Restaurar carta">
                                                    <CheckCircle2 size={15} />
                                                </Button>
                                            )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
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
                    ...(selectedCount === 1 ? [{
                        label: 'Alterar Hechizo',
                        icon: <Search className="w-4 h-4" />,
                        onClick: () => {
                            const cardToEdit = cards.find((c) => c.id === selectedList[0]);
                            if (cardToEdit) handleEdit(cardToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    {
                        label: 'Manifestar',
                        icon: <CheckCircle className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary',
                    },
                    {
                        label: 'Ocultar',
                        icon: <XIcon className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground/60 hover:text-foreground',
                    }
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
