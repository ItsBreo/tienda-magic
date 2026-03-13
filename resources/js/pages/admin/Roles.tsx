import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Role {
    id: number;
    name: string;
    description: string | null;
}

export default function AdminRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '', description: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles');
            setRoles(data.data || data); // Para soportar tanto paginación como array directo
        } catch (error) {
            toast.error('Error al cargar roles');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro que deseas eliminar este rol? Esa acción no se puede deshacer.')) return;

        try {
            await apiService.axiosInstance.delete(`/api/admin/roles/${id}`);
            toast.success('Rol eliminado');
            fetchRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRoleId) {
                // Modo Edición
                await apiService.axiosInstance.put(`/api/admin/roles/${editingRoleId}`, form);
                toast.success('Rol actualizado');
            } else {
                // Modo Creación
                await apiService.axiosInstance.post('/api/admin/roles', form);
                toast.success('Rol creado');
            }
            setShowForm(false);
            setForm({ name: '', description: '' });
            setEditingRoleId(null);
            fetchRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando rol');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-zinc-100">Gestión de Roles</h1>
                <Button onClick={() => {
                    setEditingRoleId(null);
                    setForm({ name: '', description: '' });
                    setShowForm(!showForm);
                }} className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {' '}
                    Nuevo Rol
                </Button>
            </div>

            {showForm && (
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-zinc-100 mb-4">{editingRoleId ? 'Editar Rol' : 'Crear Nuevo Rol'}</h2>
                    <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-zinc-400">Nombre del Rol (Ej: Moderador)</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-zinc-400">Descripción (Opcional)</label>
                            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-zinc-800 border-zinc-700 mt-1" />
                        </div>
                        <div className="md:col-span-2 mt-2">
                            <Button disabled={submitting} type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-black">
                                {submitting ? 'Guardando...' : (editingRoleId ? 'Actualizar Rol' : 'Guardar Rol')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-zinc-400">
                    <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Descripción</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {roles.map((r) => (
                            <tr key={r.id} className="hover:bg-zinc-800/50 transition-colors">
                                <td className="px-6 py-4 max-w-[50px]">#{r.id}</td>
                                <td className="px-6 py-4 text-zinc-100 font-medium">{r.name}</td>
                                <td className="px-6 py-4 text-zinc-500">{r.description || '-'}</td>
                                <td className="px-6 py-4 text-right whitespace-nowrap">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingRoleId(r.id);
                                        setForm({
                                            name: r.name,
                                            description: r.description || ''
                                        });
                                        setShowForm(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario
                                    }} className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(r.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
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
