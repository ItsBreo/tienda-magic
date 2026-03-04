import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Card {
    id: number;
    name: string;
    set_code: string;
    scryfall_id: string;
    rarity: string;
    price_usd: number;
}

export default function AdminCards() {
    const [cards, setCards] = useState<Card[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({ scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0 });

    useEffect(() => {
        fetchCards();
    }, []);

    const fetchCards = async () => {
        try {
            const { data } = await axios.get('/api/admin/cards');
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
            await axios.delete(`/api/admin/cards/${id}`);
            toast.success('Carta eliminada');
            fetchCards();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/admin/cards', form);
            toast.success('Carta creada');
            setShowForm(false);
            setForm({ scryfall_id: '', name: '', set_code: '', collector_number: '', rarity: 'common', mana_value: 0, price_usd: 0 });
            fetchCards();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error creando carta (Verifica el código del set)');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-100">Gestión de Cartas</h1>
                <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Nueva Carta
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">Añadir Carta Manual (Usamos código Scryfall)</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400">Nombre Carta</label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Scryfall UUID</label>
                            <Input value={form.scryfall_id} onChange={e => setForm({ ...form, scryfall_id: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1 placeholder-zinc-500" placeholder="Ej: f29...5c1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Set (Cód. ej ktk)</label>
                            <Input value={form.set_code} onChange={e => setForm({ ...form, set_code: e.target.value.toLowerCase() })} className="bg-zinc-800 border-zinc-700 mt-1 uppercase" required maxLength={10} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Número Coleccionista</label>
                            <Input value={form.collector_number} onChange={e => setForm({ ...form, collector_number: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Rareza</label>
                            <select value={form.rarity} onChange={e => setForm({ ...form, rarity: e.target.value })} className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 mt-1 text-sm text-zinc-100">
                                <option value="common">Común</option>
                                <option value="uncommon">Infrecuente</option>
                                <option value="rare">Rara</option>
                                <option value="mythic">Mítica</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Valor Maná</label>
                            <Input type="number" min="0" step="0.5" value={form.mana_value} onChange={e => setForm({ ...form, mana_value: parseFloat(e.target.value) })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div className="md:col-span-3">
                            <Button disabled={submitting} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black mt-2">
                                {submitting ? 'Guardando...' : 'Guardar Carta'}
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
                            <th className="px-6 py-4 font-medium">Rareza</th>
                            <th className="px-6 py-4 font-medium">Precio USD</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {cards.map(c => (
                            <tr key={c.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 font-medium text-zinc-200">{c.name}</td>
                                <td className="px-6 py-4 font-mono uppercase text-zinc-500">{c.set_code}</td>
                                <td className={`px-6 py-4 capitalize ${c.rarity === 'mythic' ? 'text-orange-400' :
                                        c.rarity === 'rare' ? 'text-yellow-400' :
                                            c.rarity === 'uncommon' ? 'text-slate-300' : 'text-zinc-500'
                                    }`}>{c.rarity}</td>
                                <td className="px-6 py-4">${c.price_usd || '0.00'}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(c.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
