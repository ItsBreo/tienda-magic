import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
        // Nota: El form original no incluía todos los campos necesarios para editar, 
        // pero para este ejemplo usaremos los básicos. 
        setForm({
            name: card.name,
            set_code: card.set_code,
            scryfall_id: card.scryfall_id,
            collector_number: '', // No lo recibimos en el index, se requeriría ampliar API o dejar básico
            rarity: card.rarity,
            mana_value: 0, // Idem
            price_usd: card.price_usd || 0,
            is_active: card.is_active
        });
        setShowForm(true);
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Gestión de Cartas</h1>
                    <p className="text-sm text-zinc-400">Control individual de visibilidad. Si el Set está inactivo, la carta se ocultará igualmente.</p>
                </div>
                <Button onClick={() => { setShowForm(!showForm); if (showForm) setEditingId(null); }} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Editando...' : 'Nueva Carta'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">{editingId ? 'Editar Carta' : 'Añadir Carta Manual'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className="text-xs text-zinc-400">Nombre Carta</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Rareza</label>
                            <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 mt-1 text-sm text-zinc-100">
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
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                             />
                             <label htmlFor="card_active" className="text-sm font-medium text-zinc-200 cursor-pointer">Carta Activa</label>
                        </div>
                        <div className="md:col-span-3 flex gap-2">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black mt-2">
                                {submitting ? 'Guardando...' : editingId ? 'Actualizar Carta' : 'Guardar Carta'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="flex-1 border-zinc-700 text-zinc-300 mt-2">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Set</th>
                            <th className="px-6 py-4 font-medium text-center">Estado</th>
                            <th className="px-6 py-4 font-medium">Rareza</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {cards.map((c) => {
                            const isSetInactive = c.card_set && !c.card_set.is_active;
                            return (
                                <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-zinc-200">{c.name}</span>
                                            {isSetInactive && (
                                                <span className="text-[10px] text-red-500 flex items-center gap-1">
                                                    <AlertTriangle className="w-3 h-3" /> Set Desactivado (Oculta en tienda)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono uppercase text-zinc-500">{c.set_code}</td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(c)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                                c.is_active 
                                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            }`}
                                        >
                                            {c.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {c.is_active ? 'Activa' : 'Inactiva'}
                                        </button>
                                    </td>
                                    <td className={`px-6 py-4 capitalize ${c.rarity === 'mythic' ? 'text-orange-400'
                                        : c.rarity === 'rare' ? 'text-yellow-400'
                                            : c.rarity === 'uncommon' ? 'text-slate-300' : 'text-zinc-500'
                                        }`}>
                                        {c.rarity}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(c)} className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
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
        </div>
    );
}
