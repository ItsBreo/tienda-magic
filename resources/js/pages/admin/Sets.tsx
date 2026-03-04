import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CardSet {
    code: string;
    name: string;
    released_at: string;
    card_count: number;
    icon_svg_uri: string;
}

export default function AdminSets() {
    const [sets, setSets] = useState<CardSet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({ code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '' });

    useEffect(() => {
        fetchSets();
    }, []);

    const fetchSets = async () => {
        try {
            const { data } = await axios.get('/api/admin/sets');
            setSets(data.data || data);
        } catch (error) {
            toast.error('Error al cargar sets');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (code: string) => {
        if (!window.confirm(`¿Seguro que deseas eliminar el set ${code}?`)) return;

        try {
            await axios.delete(`/api/admin/sets/${code}`);
            toast.success('Set eliminado');
            fetchSets();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post('/api/admin/sets', form);
            toast.success('Set creado');
            setShowForm(false);
            setForm({ code: '', name: '', released_at: '', card_count: 0, icon_svg_uri: '' });
            fetchSets();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error creando set');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-100">Gestión de Sets (Expansiones)</h1>
                <Button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" /> Nuevo Set
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">Crear Nuevo Set</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400">Código (ej. ktk)</label>
                            <Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toLowerCase() })} className="bg-zinc-800 border-zinc-700 mt-1 uppercase" required maxLength={10} />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Nombre del Set</label>
                            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Fecha Lanzamiento</label>
                            <Input type="date" value={form.released_at} onChange={e => setForm({ ...form, released_at: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1 block w-full" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Total Cartas</label>
                            <Input type="number" min="0" value={form.card_count} onChange={e => setForm({ ...form, card_count: parseInt(e.target.value) })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div className="md:col-span-2">
                            <Button disabled={submitting} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black mt-4">
                                {submitting ? 'Guardando...' : 'Guardar Set'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium w-16">Icono</th>
                            <th className="px-6 py-4 font-medium">Cód.</th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Lanzamiento</th>
                            <th className="px-6 py-4 font-medium">Cartas</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {sets.map(s => (
                            <tr key={s.code} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {s.icon_svg_uri && <img src={s.icon_svg_uri} alt={s.code} className="w-6 h-6 invert opacity-80" />}
                                </td>
                                <td className="px-6 py-4 font-mono text-zinc-200 uppercase">{s.code}</td>
                                <td className="px-6 py-4 font-medium text-emerald-400">{s.name}</td>
                                <td className="px-6 py-4">{s.released_at || '-'}</td>
                                <td className="px-6 py-4">{s.card_count}</td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(s.code)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
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
