import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle, AlertTriangle, CheckCircle, XCircle as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

interface Card {
    id: number;
    name: string;
    set_code: string;
    scryfall_id: string;
    rarity: string;
    price_usd: number;
    is_active: boolean;
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

    const {
        selectedList,
        selectedCount,
        toggle,
        selectAll,
        clear,
        isSelected,
        allSelected
    } = useSelection(cards);

    const [form, setForm] = useState({
        scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0, is_active: true
    });

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/cards');
            setCards(data.data || data);
        } catch (error) {
            toast.error('Error al cargar cartas');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro que deseas eliminar esta carta?')) return;

        try {
            await apiService.axiosInstance.delete(`/api/admin/cards/${id}`);
            toast.success('Carta eliminada');
            fetchCards();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (card: Card) => {
        try {
            await apiService.updateAdminCard(card.id, { is_active: !card.is_active });
            toast.success(`Carta ${!card.is_active ? 'activada' : 'desactivada'}`);
            fetchCards();
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    // --- ACCIONES MASIVAS ---

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} cartas?`)) return;
        try {
            const { data } = await apiService.axiosInstance.post('/api/admin/cards/bulk-delete', { ids: selectedList });
            toast.success(data.message);
            clear();
            fetchCards();
        } catch (error) {
            toast.error('Error al realizar borrado masivo');
        }
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/cards/bulk-toggle-active', {
                ids: selectedList,
                is_active: active
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
                toast.success('Carta actualizada');
            } else {
                await apiService.axiosInstance.post('/api/admin/cards', form);
                toast.success('Carta creada');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({
                scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0, is_active: true
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
            is_active: card.is_active
        });
        setShowForm(true);
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6 text-foreground">
                <div>
                    <h1 className="text-2xl font-bold">Gestión de Cartas</h1>
                    <p className="text-sm text-muted-foreground">Control individual de visibilidad. Si el Set está inactivo, la carta se ocultará igualmente.</p>
                </div>
                <Button 
                    onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Editando...' : 'Nueva Carta'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-foreground mb-4">{editingId ? 'Editar Carta' : 'Añadir Carta Manual'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-muted-foreground">Nombre Carta</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Rareza</label>
                            <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="w-full bg-accent border border-border rounded-md p-2 mt-1 text-sm text-foreground">
                                <option value="common">Común</option>
                                <option value="uncommon">Infrecuente</option>
                                <option value="rare">Rara</option>
                                <option value="mythic">Mítica</option>
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                             <input 
                                type="checkbox" 
                                id="card_active" 
                                checked={form.is_active} 
                                onChange={(e) => setForm({...form, is_active: e.target.checked})}
                                className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                             />
                             <label htmlFor="card_active" className="text-sm font-medium text-foreground cursor-pointer">Carta Activa</label>
                        </div>
                        <div className="md:col-span-3 flex gap-2">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground mt-2">
                                {submitting ? 'Guardando...' : editingId ? 'Actualizar Carta' : 'Guardar Carta'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 border-border text-foreground mt-2">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-background border-b border-border text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={selectAll}
                                    className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Set</th>
                            <th className="px-6 py-4 font-medium text-center">Estado</th>
                            <th className="px-6 py-4 font-medium">Rareza</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {cards.map((c) => {
                            const isSetInactive = c.card_set && !c.card_set.is_active;
                            return (
                                <tr key={c.id} className={`hover:bg-accent/50 transition-colors ${isSelected(c.id) ? 'bg-primary/5' : ''}`}>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(c.id)}
                                            onChange={() => toggle(c.id)}
                                            className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-foreground">{c.name}</span>
                                            {isSetInactive && (
                                                <span className="text-[10px] text-destructive flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Set Desactivado (Oculta en tienda)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono uppercase text-muted-foreground">{c.set_code}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(c)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                                c.is_active 
                                                ? 'bg-primary/10 text-primary border border-primary/20' 
                                                : 'bg-muted/10 text-muted-foreground border border-border'
                                            }`}
                                        >
                                            {c.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {c.is_active ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </td>
                                    <td className={`px-6 py-4 capitalize ${c.rarity === 'mythic' ? 'text-orange-400'
                                        : c.rarity === 'rare' ? 'text-yellow-400'
                                            : c.rarity === 'uncommon' ? 'text-slate-300' : 'text-muted-foreground'
                                        }`}>
                                        {c.rarity}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-destructive hover:bg-destructive/10 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
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
                            const cardToEdit = cards.find(c => c.id === selectedList[0]);
                            if (cardToEdit) handleEdit(cardToEdit);
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
                        icon: <XIcon className="w-4 h-4" />,
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
