import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Gestión de Sets (Expansiones)</h1>
                    <p className="text-sm text-zinc-400">Si desactivas un Set, todas sus cartas se ocultarán automáticamente de la tienda.</p>
                </div>
                <Button onClick={() => { setShowForm(!showForm); if (showForm) setEditingCode(null); }} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingCode ? 'Editando...' : 'Nuevo Set'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">{editingCode ? 'Editar Set' : 'Crear Nuevo Set'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="code" className="text-xs text-zinc-400">Código (ej. ktk)</label>
                            <Input id="code" value={form.code} disabled={!!editingCode} onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })} className="bg-zinc-800 border-zinc-700 mt-1 uppercase" required maxLength={10} />
                        </div>
                        <div>
                            <label htmlFor="name" className="text-xs text-zinc-400">Nombre del Set</label>
                            <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label htmlFor="released_at" className="text-xs text-zinc-400">Fecha Lanzamiento</label>
                            <Input id="released_at" type="date" value={form.released_at} onChange={(e) => setForm({ ...form, released_at: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1 block w-full" />
                        </div>
                        <div>
                            <label htmlFor="card_count" className="text-xs text-zinc-400">Total Cartas</label>
                            <Input id="card_count" type="number" min="0" value={form.card_count} onChange={(e) => setForm({ ...form, card_count: parseInt(e.target.value, 10) })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                             <input 
                                type="checkbox" 
                                id="is_active" 
                                checked={form.is_active} 
                                onChange={(e) => setForm({...form, is_active: e.target.checked})}
                                className="w-4 h-4 rounded border-zinc-700 bg-zinc-800 text-emerald-500 focus:ring-emerald-500"
                             />
                             <label htmlFor="is_active" className="text-sm font-medium text-zinc-200 cursor-pointer">Set Activo (Visibilidad en cascada)</label>
                        </div>
                        <div className="md:col-span-2 flex gap-2">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black mt-4">
                                {submitting ? 'Guardando...' : editingCode ? 'Actualizar Set' : 'Guardar Set'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingCode(null); }} className="flex-1 border-zinc-700 text-zinc-300 mt-4">
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
                            <th className="px-6 py-4 font-medium w-16">Icono</th>
                            <th className="px-6 py-4 font-medium">Cód.</th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium text-center">Estado</th>
                            <th className="px-6 py-4 font-medium">Cartas</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {sets.map((s) => (
                            <tr key={s.code} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4">
                                    {s.icon_svg_uri && <img src={s.icon_svg_uri} alt={s.code} className="w-6 h-6 invert opacity-80" />}
                                </td>
                                <td className="px-6 py-4 font-mono text-zinc-200 uppercase">{s.code}</td>
                                <td className="px-6 py-4 font-medium text-emerald-400">{s.name}</td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleToggleActive(s)}
                                        className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                            s.is_active 
                                            ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                        }`}
                                    >
                                        {s.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                        {s.is_active ? 'Activo' : 'Inactivo'}
                                    </button>
                                </td>
                                <td className="px-6 py-4">{s.card_count}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(s)} className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(s.code)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

