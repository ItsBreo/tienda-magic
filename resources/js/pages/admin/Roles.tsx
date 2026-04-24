import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
 Trash2, Plus, Loader2, Shield, ShieldCheck, Info, Edit2,
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
interface Permission {
    id: number;
    name: string;
    display_name: string;
    description: string | null;
}

interface Role {
    id: number;
    name: string;
    description: string | null;
    permissions?: Permission[];
}

interface RoleData {
    id: number;
    name: string;
    description: string;
    permission_ids: number[];
    permissions: { id: number; display_name: string }[];
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
}

export default function AdminRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
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

    const [form, setForm] = useState({
        name: '',
        description: '',
        permission_ids: [] as number[],
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
    } = useSelection(roles);

    const fetchRoles = async (page = 1) => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles', {
                params: { page }
            });
            setRoles(data.data || data);
            if (data.current_page) {
                setCurrentPage(data.current_page);
                setLastPage(data.last_page);
            }
        } catch (error) {
            toast.error('Error al cargar roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        Promise.all([fetchRoles(currentPage), fetchPermissions()]);
    }, [currentPage]);

    const fetchPermissions = async () => {
        try {
            const data = await apiService.getAdminPermissions();

            // Mapeo manual de permisos que pertenecen a mod_todos
            const modTodosPermissions = [
                'view-admin-dashboard',
                'manage-users',
                'manage-roles',
                'manage-permissions',
                'manage-cards',
                'manage-sets',
                'manage-booster-packs',
                'view-reports',
                'manage-settings'
            ];

            const filteredPermissions = data.filter(perm =>
                modTodosPermissions.includes(perm.name)
            );

            setPermissionsList(filteredPermissions);
        } catch (error) {
            toast.error('Error al cargar lista de permisos');
        }
    };

    const handleDelete = (id: number) => {
        setConfirmModalConfig({
            isOpen: true,
            title: '¿Estás seguro de exiliar este rol?',
            onConfirm: async () => {
                try {
                    await apiService.deleteRole(id);
                    toast.success('Rol exiliado exitosamente');
                    fetchRoles(currentPage);
                } catch (error) {
                    toast.error('Error al exiliar rol');
                }
            },
        });
    };

    const handleRestore = async (id: number) => {
        try {
            await apiService.axiosInstance.post(`/api/admin/roles/${id}/restore`);
            toast.success('Rol restaurado exitosamente');
            fetchRoles(currentPage);
        } catch (error: any) {
            toast.error('Error al restaurar rol');
        }
    };

    const handleForceDelete = async (id: number) => {
        setConfirmModalConfig({
            isOpen: true,
            title: '¿Estás seguro de eliminar permanentemente este rol? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.delete(`/api/admin/roles/${id}/force-delete`);
                    toast.success('Rol eliminado permanentemente');
                    fetchRoles(currentPage);
                } catch (error: any) {
                    toast.error('Error al eliminar permanentemente');
                }
            },
        });
    };

    const handleBulkDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas disolver ${selectedCount} rangos?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/roles/bulk-delete', { ids: selectedList });
                    toast.success('Rangos disueltos correctamente');
                    clear();
                    fetchRoles(currentPage);
                } catch (error) {
                    toast.error('Error al realizar borrado masivo');
                }
            }
        });
    };

    const togglePermission = (id: number) => {
        setForm((prev) => ({
            ...prev,
            permission_ids: prev.permission_ids.includes(id)
                ? prev.permission_ids.filter((pId) => pId !== id)
                : [...prev.permission_ids, id],
        }));
    };

    const handleEdit = (role: Role) => {
        setEditingRoleId(role.id);
        setForm({
            name: role.name,
            description: role.description || '',
            permission_ids: role.permissions?.map((p) => p.id) || [],
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingRoleId) {
                await apiService.updateAdminRole(editingRoleId, form);
                toast.success('Cualidades del rango actualizadas');
            } else {
                await apiService.axiosInstance.post('/api/admin/roles', form);
                toast.success('Nuevo rango forjado');
            }
            setShowForm(false);
            setForm({ name: '', description: '', permission_ids: [] });
            setEditingRoleId(null);
            fetchRoles(currentPage);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando rango');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
return (
<div className="p-20 flex flex-col items-center justify-center gap-4">
<Loader2 className="animate-spin text-primary w-10 h-10" />
<p className="text-[10px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/50">Consultando Jerarquías...</p>
</div>
);
}

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-literata">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-forum font-black text-foreground mb-2">Círculo de Poder</h1>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] font-montserrat text-muted-foreground/60">Define los rangos, privilegios y capacidades de los caminantes en el sistema.</p>
                </div>
                <Button
onClick={() => {
                    setEditingRoleId(null);
                    setForm({ name: '', description: '', permission_ids: [] });
                    setShowForm(!showForm);
                }}
className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cerrar' : 'Nuevo Rango'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-8 rounded-xl mb-12 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-16 translate-x-16" />
                    <h2 className="text-2xl font-forum font-black text-foreground mb-8 flex items-center gap-3">
                        <Shield className="text-primary w-6 h-6" />
                        {editingRoleId ? 'Alterar Cualidades del Rango' : 'Forjar Nuevo Rango'}
                    </h2>
                    <form onSubmit={handleCreateOrUpdate} className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre del Rango</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required placeholder="Ej: Protector de los Planos" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Propósito (Descripción)</label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" placeholder="Ej: Gestión de los hilos del destino..." />
                            </div>
                        </div>

                        <div className="border-t border-border/40 pt-10">
                            <div className="flex items-center gap-3 mb-6">
                                <ShieldCheck className="text-primary w-4 h-4" />
                                <label className="text-[11px] font-black font-montserrat uppercase tracking-[0.2em] text-foreground">Conceder Privilegios (Permisos)</label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {permissionsList.map((perm) => {
                                    const isSelected = form.permission_ids.includes(perm.id);
                                    return (
                                        <div
                                            key={perm.id}
                                            onClick={() => togglePermission(perm.id)}
                                            className={cn(
                                                'group relative p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col justify-between min-h-[100px]',
                                                isSelected
                                                ? 'bg-primary/5 border-primary shadow-xl shadow-primary/5'
                                                : 'bg-accent/20 border-border/30 hover:border-primary/40',
                                            )}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <p className={cn(
                                                    'text-[13px] font-black uppercase tracking-tight font-montserrat transition-colors',
                                                    isSelected ? 'text-primary' : 'text-foreground',
                                                )}>
                                                    {perm.display_name}
                                                </p>
                                                <div className={cn(
                                                    'h-5 w-5 rounded-lg border-2 flex items-center justify-center transition-all',
                                                    isSelected
                                                    ? 'bg-primary border-primary text-primary-foreground rotate-0 scale-100'
                                                    : 'border-border/60 bg-transparent rotate-90 scale-90',
                                                )}>
                                                    {isSelected && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="4" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground/60 leading-relaxed italic line-clamp-2">{perm.description || 'Sin descripción en los archivos.'}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat">
                                {submitting ? <Loader2 className="animate-spin" /> : (editingRoleId ? 'Confirmar Alteraciones' : 'Forjar Rango')}
                            </Button>
                            {editingRoleId && (
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRoleId(null); }} className="px-10 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
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
                                <th className="px-6 py-6 font-black">Designación y Rango</th>
                                <th className="px-6 py-6 font-black">Atributos Concedidos</th>
                                <th className="px-8 py-6 font-black text-right">Manejo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {roles.map((r) => (
                                <tr
key={r.id}
className={cn(
                                    'group hover:bg-accent/20 transition-all duration-300',
                                    isSelected(r.id) ? 'bg-primary/[0.03]' : '',
                                )}>
                                    <td className="px-8 py-6">
                                        <input
                                            type="checkbox"
                                            checked={isSelected(r.id)}
                                            onChange={() => toggle(r.id)}
                                            className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer"
                                        />
                                    </td>
                                    <td className="px-6 py-6 font-black text-[11px] text-muted-foreground/30 font-montserrat">
#
{r.id}
</td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-foreground font-black text-[16px] group-hover:text-primary transition-colors font-forum">{r.name}</span>
                                                {r.name.toLowerCase().includes('admin') && <ShieldCheck className="w-4 h-4 text-primary opacity-60" />}
                                                {r.name.toLowerCase() === 'super_admin' && <Badge className="bg-primary text-primary-foreground text-[7px] font-black h-4 px-1 rounded uppercase tracking-[0.2em]">Raíz</Badge>}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground/50 leading-relaxed italic">{r.description || 'Este rango aún no ha sido descrito.'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-wrap gap-1.5 max-w-md">
                                            {(() => {
                                                return r.permissions && r.permissions.length > 0 ? (
                                                    r.permissions.map((p) => (
                                                        <Badge key={p.id} variant="outline" className="bg-accent/40 text-[8px] font-black uppercase tracking-[0.1em] text-muted-foreground/60 border-border/30 h-5 px-2 hover:border-primary/30 hover:text-primary transition-all">
                                                            {p.display_name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <div className="flex items-center gap-2 opacity-20 italic">
                                                        <Info size={10} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest font-montserrat px-1">Sin Atributos</span>
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(r)} className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-primary/10">
                                                <Edit2 size={15} />
                                            </Button>
                                            {!r.deleted_at ? (
                                                // Rol ACTIVO (no exiliado)
                                                <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-muted-foreground hover:text-warning-600 hover:bg-warning-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-warning-20" title="Exiliar rol">
                                                    <UserMinus size={15} />
                                                </Button>
                                            ) : (
                                                // Rol EXILIADO (soft deleted)
                                                <>
                                                    <Button variant="ghost" size="icon" onClick={() => handleRestore(r.id)} className="text-muted-foreground hover:text-green-600 hover:bg-green-10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-green-20" title="Restaurar rol">
                                                        <UserCheck size={15} />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleForceDelete(r.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl shadow-inner border border-transparent hover:border-destructive/10" title="Eliminar permanentemente">
                                                        <Trash2 size={15} />
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
                        label: 'Alterar Rango',
                        icon: <ShieldCheck className="w-4 h-4" />,
                        onClick: () => {
                            const roleToEdit = roles.find((r) => r.id === selectedList[0]);
                            if (roleToEdit) handleEdit(roleToEdit);
                        },
                        className: 'text-primary hover:text-primary',
                    }] : []),
                    {
                        label: 'Disolver Rangos',
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
        </div>
    );
}
