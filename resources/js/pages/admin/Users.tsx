import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    roles: { id: number; name: string }[];
}

export default function AdminUsers() {
    const [users, setUsers] = useState<User[]>([]);
    const [availableRoles, setAvailableRoles] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '', username: '', email: '', password: '', role_id: '1',
    }); // Role 1 = User/Normal (or verify DB roles)
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles');
            setAvailableRoles(data.data || data);
            // Si hay roles pero el formulario tiene el role_id '1' y no existe, podríamos ajustarlo. 
            // Pero como por defecto ponemos '1', servirá.
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/users');
            setUsers(data.data || data); // Laravel pagination returns data array
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('¿Seguro que deseas eliminar este usuario? Esa acción no se puede deshacer.')) return;

        try {
            await apiService.axiosInstance.delete(`/api/admin/users/${id}`);
            toast.success('Usuario eliminado');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al eliminar');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUserId) {
                // Modo Edición
                await apiService.axiosInstance.put(`/api/admin/users/${editingUserId}`, form);
                toast.success('Usuario actualizado');
            } else {
                // Modo Creación
                await apiService.axiosInstance.post('/api/admin/users', form);
                toast.success('Usuario creado');
            }
            setShowForm(false);
            setForm({
                name: '', username: '', email: '', password: '', role_id: '1',
            });
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error creando usuario');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
                <Button onClick={() => {
                    setEditingUserId(null);
                    setForm({ name: '', username: '', email: '', password: '', role_id: '1' });
                    setShowForm(!showForm);
                }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {' '}
                    Nuevo Usuario
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-6 rounded-xl mb-8 shadow-xl">
                    <h2 className="text-lg font-bold text-foreground mb-4">{editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
                    <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-muted-foreground">Nombre Real</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Username (Nick)</label>
                            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Email</label>
                            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent border-border mt-1" required />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Contraseña {editingUserId && '(Opcional)'}</label>
                            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-accent border-border mt-1" required={!editingUserId} />
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground">Rol Predeterminado</label>
                            <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full bg-accent border border-border rounded-md p-2 mt-1 text-sm text-foreground">
                                {/* Mostramos los roles traídos dinámicamente de la base de datos */}
                                {availableRoles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2 mt-2">
                            <Button disabled={submitting} type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                {submitting ? 'Guardando...' : (editingUserId ? 'Actualizar Usuario' : 'Guardar Usuario')}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-background border-b border-border text-xs uppercase">
                        <tr>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Nombre</th>
                            <th className="px-6 py-4 font-medium">Nick</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium">Roles</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((u) => (
                            <tr key={u.id} className="hover:bg-accent/50 transition-colors">
                                <td className="px-6 py-4">
                                    #
                                    {u.id}
                                </td>
                                <td className="px-6 py-4 text-foreground">{u.name}</td>
                                <td className="px-6 py-4">{u.username}</td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4">
                                    {u.roles?.map((r) => (
                                        <span key={r.id} className="px-2 py-1 bg-accent text-xs rounded-md border border-border mr-2">{r.name}</span>
                                    ))}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button variant="ghost" size="sm" onClick={() => {
                                        setEditingUserId(u.id);
                                        setForm({
                                            name: u.name,
                                            username: u.username,
                                            email: u.email,
                                            password: '', // En blanco por defecto al editar
                                            role_id: u.roles.length > 0 ? u.roles[0].id.toString() : '1'
                                        });
                                        setShowForm(true);
                                        window.scrollTo({ top: 0, behavior: 'smooth' }); // Subir al formulario
                                    }} className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 mr-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300">
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
