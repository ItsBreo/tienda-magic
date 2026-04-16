import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Edit2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

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
        is_active: true
    });

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
        if (!window.confirm('¿Seguro que deseas eliminar este sobre?')) return;

        try {
            await apiService.deleteBoosterPack(id);
            toast.success('Sobre eliminado');
            fetchPacks();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleToggleActive = async (pack: BoosterPack) => {
        try {
            await apiService.updateBoosterPack(pack.id, { is_active: !pack.is_active });
            toast.success(`Sobre ${!pack.is_active ? 'activado' : 'desactivado'}`);
            fetchPacks();
        } catch (error: any) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                await apiService.updateBoosterPack(editingId, form);
                toast.success('Sobre actualizado');
            } else {
                await apiService.createBoosterPack(form);
                toast.success('Sobre creado');
            }
            setShowForm(false);
            setEditingId(null);
            setForm({
                name: '', price: 0, card_set_id: '', type: 'booster', image_uri: '', is_active: true
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
            is_active: pack.is_active
        });
        setShowForm(true);
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-100">Gestión de Sobres</h1>
                    <p className="text-sm text-zinc-400">Administra los productos de tipo Booster Pack y su visibilidad.</p>
                </div>
                <Button onClick={() => {
                    setShowForm(!showForm);
                    if (showForm) setEditingId(null);
                }} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Editando...' : 'Nuevo Sobre'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">{editingId ? 'Editar Sobre' : 'Crear Nuevo Sobre'}</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400">Nombre del Sobre</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Precio (€)</label>
                            <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Código del Set</label>
                            <Input value={form.card_set_id} onChange={(e) => setForm({ ...form, card_set_id: e.target.value.toLowerCase() })} className="bg-zinc-800 border-zinc-700 mt-1 uppercase" required placeholder="ej: ktk" />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Tipo</label>
                            <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div className="md:col-span-2">
                            <label className="text-xs text-zinc-400">URL Imagen (Opcional)</label>
                            <Input value={form.image_uri} onChange={(e) => setForm({ ...form, image_uri: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" />
                        </div>
                        <div className="flex items-center space-x-2 py-2">
                            <Checkbox 
                                id="active-mode"
                                checked={form.is_active} 
                                onCheckedChange={(val: boolean) => setForm({ ...form, is_active: val })} 
                            />
                            <label htmlFor="active-mode" className="text-sm font-medium text-zinc-200 cursor-pointer select-none">
                                Activo / Visible en tienda
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-2 pt-2">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black">
                                {submitting ? 'Guardando...' : editingId ? 'Actualizar Sobre' : 'Guardar Sobre'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }} className="border-zinc-700 text-zinc-300">
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-zinc-400">
                        <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase text-zinc-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Sobre</th>
                                <th className="px-6 py-4 font-semibold">Set</th>
                                <th className="px-6 py-4 font-semibold">Precio</th>
                                <th className="px-6 py-4 font-semibold text-center">Estado</th>
                                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {packs.map((p) => (
                                <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-8 bg-zinc-800 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {p.image_uri ? (
                                                    <img src={p.image_uri} alt={p.name} className="h-full w-full object-cover" />
                                                ) : (
                                                    <div className="text-[10px] text-zinc-600 uppercase font-bold">{p.card_set_id}</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-zinc-200 line-clamp-1">{p.name}</span>
                                                <span className="text-[10px] text-zinc-500 uppercase">{p.type}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 uppercase font-mono text-zinc-400">
                                        {p.card_set_id}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-emerald-400">
                                        {p.price.toFixed(2)}€
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => handleToggleActive(p)}
                                            className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold uppercase transition-all ${
                                                p.is_active 
                                                ? 'bg-emerald-900/20 text-emerald-400 border border-emerald-500/20' 
                                                : 'bg-zinc-800 text-zinc-500 border border-zinc-700'
                                            }`}
                                        >
                                            {p.is_active ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                            {p.is_active ? 'Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(p)} className="text-zinc-400 hover:text-emerald-400 hover:bg-emerald-400/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="text-zinc-400 hover:text-red-400 hover:bg-red-400/10">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {packs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-zinc-500">
                                        No se encontraron sobres creados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
