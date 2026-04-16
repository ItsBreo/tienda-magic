import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, UserCheck, UserMinus, UserCog, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    is_active: boolean;
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
        name: '', username: '', email: '', password: '', role_id: '1', is_active: true,
    });
    const [submitting, setSubmitting] = useState(false);

    const { 
        selectedList, 
        selectedCount, 
        toggle, 
        selectAll, 
        clear, 
        isSelected, 
        allSelected 
    } = useSelection(users);

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles');
            setAvailableRoles(data.data || data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/users');
            setUsers(data.data || data);
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

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} usuarios?`)) return;
        try {
            const { data } = await apiService.axiosInstance.post('/api/admin/users/bulk-delete', { ids: selectedList });
            toast.success(data.message);
            clear();
            fetchUsers();
        } catch (error) {
            toast.error('Error al realizar borrado masivo');
        }
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/users/bulk-toggle-active', { 
                ids: selectedList, 
                is_active: active 
            });
            toast.success(`${selectedCount} usuarios ${active ? 'activados' : 'desactivados'}`);
            clear();
            fetchUsers();
        } catch (error) {
            toast.error('Error al cambiar estado masivo');
        }
    };

    const handleBulkChangeRole = async () => {
        const roleId = prompt('Introduce el ID del nuevo rol para los usuarios seleccionados:\n' + 
            availableRoles.map(r => `${r.id}: ${r.name}`).join('\n'));
        
        if (!roleId) return;

        try {
            await apiService.axiosInstance.post('/api/admin/users/bulk-change-role', { 
                ids: selectedList, 
                role_id: parseInt(roleId) 
            });
            toast.success('Rol actualizado para ' + selectedCount + ' usuarios');
            clear();
            fetchUsers();
        } catch (error) {
            toast.error('Error al cambiar rol masivo');
        }
    };

    const handleEdit = (u: User) => {
        setEditingUserId(u.id);
        const roleId = u.roles.length > 0 ? u.roles[0].id.toString() : '1';
        setForm({
            name: u.name,
            username: u.username,
            email: u.email,
            password: '',
            role_id: roleId,
            is_active: u.is_active
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingUserId) {
                await apiService.axiosInstance.put(`/api/admin/users/${editingUserId}`, form);
                toast.success('Usuario actualizado');
            } else {
                await apiService.axiosInstance.post('/api/admin/users', form);
                toast.success('Usuario creado');
            }
            setShowForm(false);
            setForm({
                name: '', username: '', email: '', password: '', role_id: '1', is_active: true,
            });
            setEditingUserId(null);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando usuario');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
                    <p className="text-sm text-muted-foreground">Administra las cuentas, permisos y estados de acceso de los usuarios.</p>
                </div>
                <Button onClick={() => {
                    setEditingUserId(null);
                    setForm({
                        name: '', username: '', email: '', password: '', role_id: '1', is_active: true,
                    });
                    setShowForm(!showForm);
                }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Usuario'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-6 rounded-xl mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-foreground mb-4">{editingUserId ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h2>
                    <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <label className="text-xs text-muted-foreground">Rol Principal</label>
                            <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full bg-accent border border-border rounded-md px-3 py-2 mt-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                                {availableRoles.map(role => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-2 pt-6">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                            />
                            <label htmlFor="is_active" className="text-sm font-medium text-foreground cursor-pointer">
                                Cuenta Activa
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-3 mt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
                                {submitting ? 'Guardando...' : (editingUserId ? 'Actualizar Usuario' : 'Guardar Usuario')}
                            </Button>
                            {editingUserId && (
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingUserId(null); }} className="flex-1 border-border text-muted-foreground hover:bg-accent h-12">
                                    Cancelar
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl">
                <table className="w-full text-left text-sm text-muted-foreground">
                    <thead className="bg-accent/40 border-b border-border text-xs uppercase tracking-widest font-bold">
                        <tr>
                            <th className="px-6 py-4 font-medium w-10">
                                <input 
                                    type="checkbox" 
                                    checked={allSelected} 
                                    onChange={selectAll}
                                    className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-4 font-medium">ID</th>
                            <th className="px-6 py-4 font-medium">Usuario</th>
                            <th className="px-6 py-4 font-medium">Email</th>
                            <th className="px-6 py-4 font-medium text-center">Estado</th>
                            <th className="px-6 py-4 font-medium">Roles</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {users.map((u) => (
                            <tr key={u.id} className={`group hover:bg-accent/30 transition-all duration-300 ${isSelected(u.id) ? 'bg-primary/5' : ''}`}>
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        checked={isSelected(u.id)} 
                                        onChange={() => toggle(u.id)}
                                        className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-4 font-mono">#{u.id}</td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-bold">{u.name}</span>
                                        <span className="text-xs text-muted-foreground">@{u.username}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">{u.email}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${u.is_active ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                                        {u.is_active ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {u.roles?.map((r) => (
                                            <span key={r.id} className="px-2 py-0.5 bg-accent text-[10px] text-muted-foreground rounded border border-border">{r.name}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(u)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 p-0">
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
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
                            const userToEdit = users.find(u => u.id === selectedList[0]);
                            if (userToEdit) handleEdit(userToEdit);
                        },
                        className: 'text-primary hover:text-primary/80'
                    }] : []),
                    { 
                        label: 'Activar', 
                        icon: <UserCheck className="w-4 h-4" />, 
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary/80'
                    },
                    { 
                        label: 'Desactivar', 
                        icon: <UserMinus className="w-4 h-4" />, 
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground hover:text-foreground'
                    },
                    { 
                        label: 'Cambiar Rol', 
                        icon: <UserCog className="w-4 h-4" />, 
                        onClick: handleBulkChangeRole,
                        className: 'text-primary hover:text-primary/80'
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
