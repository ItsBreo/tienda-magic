import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Plus, Loader2, UserCheck, UserMinus, UserCog, Edit2, Shield, Mail, User,
 ChevronUp, ChevronDown, ArrowUpDown,
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
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
    }, [currentPage, sortBy, sortDir]);

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
                params: {
                    page,
                    sort_by: sortBy,
                    sort_dir: sortDir
                }
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

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setCurrentPage(1);
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
            title: `¿Seguro que deseas exiliar a ${selectedCount} usuarios?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/users/bulk-delete', { ids: selectedList });
                    toast.success('Usuarios exiliados correctamente');
                    clear();
                    fetchUsers(currentPage);
                } catch (error) {
                    toast.error('Error al realizar exilio masivo');
                }
            }
        });
    };

    const handleBulkRestore = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Deseas restaurar ${selectedCount} almas exiliadas?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/users/bulk-restore', { ids: selectedList });
                    toast.success('Restauración masiva completada');
                    clear();
                    fetchUsers(currentPage);
                } catch (error) {
                    toast.error('Error al restaurar usuarios');
                }
            }
        });
    };

    // Helper functions to determine selection state
    const getSelectedUsers = () => {
        return users.filter(user => selectedList.includes(user.id));
    };

    const areAllSelectedAlive = () => {
        const selectedUsers = getSelectedUsers();
        return selectedUsers.length > 0 && selectedUsers.every(user => user.deleted_at === null);
    };

    const areAllSelectedExiled = () => {
        const selectedUsers = getSelectedUsers();
        return selectedUsers.length > 0 && selectedUsers.every(user => user.deleted_at !== null);
    };

    const hasMixedSelection = () => {
        const selectedUsers = getSelectedUsers();
        return selectedUsers.length > 0 && !areAllSelectedAlive() && !areAllSelectedExiled();
    };

    // Solo permite hard delete si todos los seleccionados están exiliados (soft deleted)
    const canHardDelete = areAllSelectedExiled();

    const handleBulkForceDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿ELIMINAR DEFINITIVAMENTE ${selectedCount} ALMAS? Esta acción es irreversible.`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/users/bulk-force-delete', { ids: selectedList });
                    toast.success('Eliminación definitiva completada');
                    clear();
                    fetchUsers(currentPage);
                } catch (error) {
                    toast.error('Error al eliminar permanentemente');
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


    const handleBulkChangeRole = () => {
        if (availableRoles.length > 0) setSelectedRoleForBulk(availableRoles[0].id.toString());
        setRolePromptOpen(true);
    };

    const handleEdit = (u: UserData) => {
        setSelectedUser(u);
        setEditingUserId(u.id);
        setForm({
            name: u.name,
            username: u.username,
            email: u.email,
            password: '',
            role_id: u.roles[0]?.id.toString() || '1',
            is_active: u.is_active,
        });
        setEditModalOpen(true);
    };

    const handleCreateNew = () => {
        setSelectedUser(null);
        setEditingUserId(null);
        setForm({
            name: '', username: '', email: '', password: '', role_id: '1', is_active: true,
        });
        setEditModalOpen(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
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
            setEditModalOpen(false);
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
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Círculo de Almas</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Gestión de caminantes, roles y privilegios dentro del sistema.</p>
                </div>
                <Button
                    onClick={handleCreateNew}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Caminante
                </Button>
            </div>

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
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Caminante
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'name' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('email')}>
                                    <div className="flex items-center gap-1">
                                        Contacto
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'email' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('is_active')}>
                                    <div className="flex items-center gap-1 justify-center">
                                        Estado
                                        <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'is_active' && "opacity-100 text-primary")} />
                                    </div>
                                </th>
                                <th className="px-6 py-6 font-black text-right">Roles Arcanos</th>
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
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-accent border border-border/50 flex items-center justify-center text-[10px] font-black text-muted-foreground shadow-inner">
                                                <User size={14} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-foreground font-black text-[15px] group-hover:text-primary transition-colors font-forum leading-tight">{u.name}</span>
                                                <span className="text-[10px] text-muted-foreground/50 uppercase font-black tracking-widest font-montserrat mt-1">
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
                                        {u.deleted_at ? (
                                            <Badge
                                                variant="outline"
                                                className="text-[8px] font-black uppercase tracking-widest px-2.5 h-5 rounded-lg bg-destructive/10 text-destructive border-destructive/20"
                                            >
                                                Exiliado
                                            </Badge>
                                        ) : (
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    'text-[8px] font-black uppercase tracking-widest px-2.5 h-5 rounded-lg',
                                                    u.is_active ? 'bg-primary/5 text-primary border-primary/20' : 'bg-warning/5 text-warning-600 border-warning/20',
                                                )}
                                            >
                                                {u.is_active ? 'Vivo' : 'Inactivo'}
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap justify-end gap-1.5">
                                            {u.roles?.map((r) => (
                                                <Badge key={r.id} className="bg-accent/60 text-[9px] font-black uppercase tracking-widest text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors cursor-default border-border/50">
                                                    <Shield size={10} className="mr-1.5 opacity-50" />
                                                    {r.name}
                                                </Badge>
                                            ))}
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
                    ...(selectedCount === 1 && !hasMixedSelection() ? [{
                        label: 'Editar Ficha',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {
                            const userToEdit = users.find((u) => u.id === selectedList[0]);
                            if (userToEdit) openEditModal(userToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    ...(areAllSelectedAlive() ? [
                        {
                            label: 'Exiliar',
                            icon: <UserMinus className="w-4 h-4" />,
                            onClick: handleBulkDelete,
                            className: 'text-warning-600 hover:text-warning-700',
                        },
                        {
                            label: 'Reasignar Rango',
                            icon: <UserCog className="w-4 h-4" />,
                            onClick: handleBulkChangeRole,
                            className: 'text-primary hover:text-primary',
                        },
                    ] : []),
                    ...(areAllSelectedExiled() ? [
                        {
                            label: 'Restaurar',
                            icon: <UserCheck className="w-4 h-4" />,
                            onClick: handleBulkRestore,
                            className: 'text-green-600 hover:text-green-700',
                        },
                        {
                            label: 'Borrar Definitivamente',
                            icon: <Plus className="w-4 h-4 rotate-45" />,
                            onClick: handleBulkForceDelete,
                            className: 'text-destructive hover:text-destructive',
                        },
                    ] : []),
                    ...(hasMixedSelection() ? [{
                        label: 'Selección mixta - no se pueden aplicar acciones',
                        icon: <Edit2 className="w-4 h-4" />,
                        onClick: () => {},
                        className: 'text-muted-foreground/40 cursor-not-allowed',
                    }] : []),
                ]}
            />
            <ConfirmModal
                isOpen={confirmModalConfig.isOpen}
                onClose={() => setConfirmModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModalConfig.onConfirm}
                title={confirmModalConfig.title}
            />

            {/* Modal de Adición/Edición de Usuario */}
            {editModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <h2 className="text-2xl font-forum font-black text-foreground mb-8 flex items-center gap-3">
                            <User className="text-primary w-6 h-6" />
                            {editingUserId ? 'Alterar Cualidades del Caminante' : 'Inscribir Nuevo Caminante'}
                        </h2>
                        <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    {submitting ? 'Procesando...' : (editingUserId ? 'Confirmar Alteraciones' : 'Inscribir Caminante')}
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
