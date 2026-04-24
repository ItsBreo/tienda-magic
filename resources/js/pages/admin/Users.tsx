import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Trash2, Plus, Loader2, UserCheck, UserMinus, UserCog, Edit2, Shield, Mail, User,
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
interface UserData {
    id: number;
    name: string;
    username: string;
    email: string;
    is_active: boolean;
    deleted_at: string | null;
    roles: { id: number; name: string }[];
}

export default function AdminUsers() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [availableRoles, setAvailableRoles] = useState<{ id: number; name: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingUserId, setEditingUserId] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
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

    const [rolePromptOpen, setRolePromptOpen] = useState(false);
    const [selectedRoleForBulk, setSelectedRoleForBulk] = useState('1');

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
        allSelected,
    } = useSelection(users);

    useEffect(() => {
        fetchUsers(currentPage);
        fetchRoles();
    }, [currentPage]);

    const fetchRoles = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles');
            setAvailableRoles(data.data || data);
        } catch (error) {
            console.error('Error fetching roles:', error);
        }
    };

    const fetchUsers = async (page = 1) => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/users', {
                params: { page }
            });
            setUsers(data.data || data);
            if (data.current_page) {
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
            }
        } catch (error) {
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModalConfig({
            isOpen: true,
            title: '¿Seguro que deseas eliminar este usuario? Esa acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.delete(`/api/admin/users/${id}`);
                    toast.success('Usuario eliminado');
                    fetchUsers(currentPage);
                } catch (error: any) {
                    toast.error(error.response?.data?.message || 'Error al eliminar');
                }
            }
        });
    };

    const handleBulkDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas eliminar ${selectedCount} usuarios?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/users/bulk-delete', { ids: selectedList });
                    toast.success('Usuarios eliminados correctamente');
                    clear();
                    fetchUsers(currentPage);
                } catch (error) {
                    toast.error('Error al realizar borrado masivo');
                }
            }
        });
    };

    const handleBulkToggleActive = async (active: boolean) => {
        try {
            await apiService.axiosInstance.post('/api/admin/users/bulk-toggle-active', {
                ids: selectedList,
                is_active: active,
            });
            toast.success(`${selectedCount} usuarios ${active ? 'activados' : 'desactivados'}`);
            clear();
            fetchUsers(currentPage);
        } catch (error) {
            toast.error('Error al cambiar estado masivo');
        }
    };

    const handleRestore = async (id: number) => {
        try {
            await apiService.axiosInstance.post(`/api/admin/users/${id}/restore`);
            toast.success('Usuario restaurado exitosamente');
            fetchUsers(currentPage);
        } catch (error: any) {
            toast.error('Error al restaurar usuario');
        }
    };

    const handleForceDelete = async (id: number) => {
        setConfirmModalConfig({
            isOpen: true,
            title: '¿Estás seguro de eliminar permanentemente este usuario? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.delete(`/api/admin/users/${id}/force-delete`);
                    toast.success('Usuario eliminado permanentemente');
                    fetchUsers(currentPage);
                } catch (error: any) {
                    toast.error('Error al eliminar permanentemente');
                }
            },
        });
    };

    const handleBulkChangeRole = () => {
        if (availableRoles.length > 0) setSelectedRoleForBulk(availableRoles[0].id.toString());
        setRolePromptOpen(true);
    };

    const handleEdit = (u: UserData) => {
        setSelectedUser(u);
        setEditModalOpen(true);
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
            fetchUsers(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const handleModalUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;

        setSubmitting(true);
        try {
            await apiService.axiosInstance.put(`/api/admin/users/${selectedUser.id}`, form);
            toast.success('Usuario actualizado');
            setEditModalOpen(false);
            setSelectedUser(null);
            fetchUsers(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando usuario');
        } finally {
            setSubmitting(false);
        }
    };

    const openEditModal = (user: UserData) => {
        setSelectedUser(user);
        const roleId = user.roles.length > 0 ? user.roles[0].id.toString() : '1';
        setForm({
            name: user.name,
            username: user.username,
            email: user.email,
            password: '',
            role_id: roleId,
            is_active: user.is_active,
        });
        setEditModalOpen(true);
    };

    if (loading) {
return (
<div className="p-20 flex flex-col items-center justify-center gap-4">
<Loader2 className="animate-spin text-primary w-10 h-10" />
<p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Consultando Pergaminos...</p>
</div>
);
}

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Libro de Almas</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Gestión de usuarios, permisos y estados de acceso al sistema.</p>
                </div>
                <Button
onClick={() => {
                    setEditingUserId(null);
                    setForm({
 name: '', username: '', email: '', password: '', role_id: '1', is_active: true,
});
                    setShowForm(!showForm);
                }}
className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cerrar' : 'Nuevo Usuario'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-8 rounded-xl mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                    <h2 className="text-2xl font-forum font-black text-foreground mb-8">{editingUserId ? 'Actualizar Pergamino' : 'Registrar Nueva Alma'}</h2>
                    <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre Real</label>
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">
Contraseña
{editingUserId && '(Opcional)'}
</label>
                            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required={!editingUserId} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Rol del Sistema</label>
                            <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full bg-accent/40 border border-border/50 rounded-xl px-4 h-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                                {availableRoles.map((role) => (
                                    <option key={role.id} value={role.id}>{role.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center space-x-3 pt-6 ml-1">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={form.is_active}
                                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer transition-all"
                            />
                            <label htmlFor="is_active" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">
                                Cuenta Activa
                            </label>
                        </div>
                        <div className="md:col-span-2 flex gap-4 pt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 font-montserrat">
                                {submitting ? 'Guardando...' : (editingUserId ? 'Confirmar Actualización' : 'Guardar Nuevo Registro')}
                            </Button>
                            {editingUserId && (
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingUserId(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
                                    Cancelar
                                </Button>
                            )}
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
                                <th className="px-6 py-6 font-black">ID</th>
                                <th className="px-6 py-6 font-black">Identidad</th>
                                <th className="px-6 py-6 font-black">Contacto</th>
                                <th className="px-6 py-6 font-black text-center">Estado</th>
                                <th className="px-6 py-6 font-black">Rango</th>
                                <th className="px-8 py-6 font-black text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {users.map((u) => (
                                <tr
key={u.id}
className={cn(
                                    'group hover:bg-accent/20 transition-all duration-300',
                                    isSelected(u.id) ? 'bg-primary/[0.03]' : '',
                                )}>
                                    <td className="px-8 py-5">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(u.id)}
                                            onChange={() => toggle(u.id)}
                                            className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-5 font-black text-[11px] text-muted-foreground/30 font-montserrat">
#
{u.id}
</td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-accent border border-border/50 flex items-center justify-center text-[10px] font-black text-muted-foreground shadow-inner">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-black text-[15px] group-hover:text-primary transition-colors">{u.name}</span>
                                                <span className="text-[10px] text-muted-foreground/50 uppercase font-black tracking-widest font-montserrat">
@
{u.username}
</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2 text-muted-foreground/80">
                                            <Mail size={12} className="opacity-30" />
                                            <span className="text-[13px] italic">{u.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <Badge
variant="outline"
className={cn(
                                            'text-[8px] font-black uppercase tracking-widest px-2.5 h-5 rounded-lg',
                                            u.is_active ? 'bg-primary/5 text-primary border-primary/20' : 'bg-destructive/5 text-destructive border-destructive/20',
                                        )}>
                                            {u.is_active ? 'Vivo' : 'Exiliado'}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-1.5">
                                            {u.roles?.map((r) => (
                                                <Badge key={r.id} className="bg-accent/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default border-border/50">
                                                    <Shield size={10} className="mr-1.5 opacity-50" />
                                                    {r.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <Button variant="ghost" size="icon" onClick={() => openEditModal(u)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-primary/10">
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            {!u.deleted_at ? (
                                                // Usuario ACTIVO (no exiliado)
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="text-muted-foreground hover:text-warning-600 hover:bg-warning-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-warning-20" title="Exiliar usuario">
                                                    <UserMinus className="w-4 h-4" />
                                                </Button>
                                            ) : (
                                                // Usuario EXILIADO (soft deleted)
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRestore(u.id)} className="text-muted-foreground hover:text-green-600 hover:bg-green-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-green-20" title="Restaurar usuario">
                                                        <UserCheck className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleForceDelete(u.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-destructive/10" title="Eliminar permanentemente">
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
                        label: 'Editar Ficha',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const userToEdit = users.find((u) => u.id === selectedList[0]);
                            if (userToEdit) openEditModal(userToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    {
                        label: 'Desexiliar',
                        icon: <UserCheck className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(true),
                        className: 'text-primary hover:text-primary',
                    },
                    {
                        label: 'Exiliar',
                        icon: <UserMinus className="w-4 h-4" />,
                        onClick: () => handleBulkToggleActive(false),
                        className: 'text-muted-foreground/60 hover:text-foreground',
                    },
                    {
                        label: 'Reasignar Rango',
                        icon: <UserCog className="w-4 h-4" />,
                        onClick: handleBulkChangeRole,
                        className: 'text-primary hover:text-primary',
                    },
                    {
                        label: 'Borrar Alma',
                        icon: <Trash2 className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        variant: 'destructive',
                        className: 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-white border border-destructive/20 rounded-xl',
                    },
                ]}
            />
            <ConfirmModal
                isOpen={confirmModalConfig.isOpen}
                onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModalConfig.onConfirm}
                title={confirmModalConfig.title}
            />

            {/* Modal de Edición de Usuario */}
            {editModalOpen && selectedUser && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <h2 className="text-2xl font-forum font-black text-foreground mb-8">Actualizar Pergamino</h2>
                        <form onSubmit={handleModalUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre Real</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Username</label>
                                <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">
Contraseña (Opcional)
</label>
                                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Rol del Sistema</label>
                                <select value={form.role_id} onChange={(e) => setForm({ ...form, role_id: e.target.value })} className="w-full bg-accent/40 border border-border/50 rounded-xl px-4 h-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                                    {availableRoles.map((role) => (
                                        <option key={role.id} value={role.id}>{role.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center space-x-3 pt-6 ml-1">
                                <input
                                    type="checkbox"
                                    id="is_active_modal"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer transition-all"
                                />
                                <label htmlFor="is_active_modal" className="text-[13px] font-black uppercase tracking-widest text-foreground cursor-pointer select-none font-montserrat">
                                    Cuenta Activa
                                </label>
                            </div>
                            <div className="md:col-span-2 flex gap-4 pt-4">
                                <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 font-montserrat">
                                    {submitting ? 'Guardando...' : 'Confirmar Actualización'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setEditModalOpen(false); setSelectedUser(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={rolePromptOpen}
                onClose={() => setRolePromptOpen(false)}
                title="Cambiar Rol Masivo"
                description={`Selecciona el nuevo rol para los ${selectedCount} usuarios seleccionados.`}
                confirmText="Aplicar Cambios"
                variant="default"
                onConfirm={async () => {
                    try {
                        await apiService.axiosInstance.post('/api/admin/users/bulk-change-role', {
                            ids: selectedList,
                            role_id: parseInt(selectedRoleForBulk),
                        });
                        toast.success(`Rol actualizado para ${selectedCount} usuarios`);
                        clear();
                        fetchUsers(currentPage);
                    } catch (error) {
                        toast.error('Error al cambiar rol masivo');
                    }
                }}
            >
                <select value={selectedRoleForBulk} onChange={e => setSelectedRoleForBulk(e.target.value)} className="w-full bg-accent/40 border border-border/50 rounded-xl px-4 h-12 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-medium appearance-none">
                    {availableRoles.map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                </select>
            </ConfirmModal>
        </div>
    );
}
