import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Plus, Loader2, Shield, UserMinus, ShieldCheck, Info, Edit2, UserCheck,
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
    created_at: string;
    deleted_at?: string | null;
}

export default function AdminRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [sortBy, setSortBy] = useState('id');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

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
                params: { 
                    page,
                    sort_by: sortBy,
                    sort_dir: sortDir
                }
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

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    useEffect(() => {
        Promise.all([fetchRoles(currentPage), fetchPermissions()]);
    }, [currentPage, sortBy, sortDir]);

    const fetchPermissions = async () => {
        try {
            const data = await apiService.getAdminPermissions();
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

    const handleBulkDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Seguro que deseas exiliar ${selectedCount} rangos?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/roles/bulk-delete', { ids: selectedList });
                    toast.success('Rangos exiliados correctamente');
                    clear();
                    fetchRoles(currentPage);
                } catch (error) {
                    toast.error('Error al realizar exilio masivo');
                }
            }
        });
    };

    const handleBulkRestore = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿Deseas restaurar ${selectedCount} rangos exiliados?`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/roles/bulk-restore', { ids: selectedList });
                    toast.success('Restauración masiva completada');
                    clear();
                    fetchRoles(currentPage);
                } catch (error) {
                    toast.error('Error al restaurar roles');
                }
            }
        });
    };

    const handleBulkForceDelete = () => {
        setConfirmModalConfig({
            isOpen: true,
            title: `¿ELIMINAR DEFINITIVAMENTE ${selectedCount} RANGOS? Esta acción es irreversible.`,
            onConfirm: async () => {
                try {
                    await apiService.axiosInstance.post('/api/admin/roles/bulk-force-delete', { ids: selectedList });
                    toast.success('Eliminación definitiva completada');
                    clear();
                    fetchRoles(currentPage);
                } catch (error) {
                    toast.error('Error al eliminar permanentemente');
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
                <div className="flex gap-4">
                    <Button
                        onClick={() => {
                            setEditingRoleId(null);
                            setForm({ name: '', description: '', permission_ids: [] });
                            setShowForm(true);
                        }}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest px-8 h-12 rounded-xl shadow-xl shadow-primary/20 transition-all font-montserrat"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Rango
                    </Button>
                </div>
            </div>

            {/* Modal de Adición/Edición de Rango */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-card border border-border rounded-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent" />
                        <h2 className="text-2xl font-forum font-black text-foreground mb-8 flex items-center gap-3">
                            <ShieldCheck className="text-primary w-6 h-6" />
                            {editingRoleId ? 'Alterar Pergamino de Rango' : 'Forjar Nuevo Rango'}
                        </h2>
                        <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Nombre del Rango (ID)</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required placeholder="Ej: mod_tournaments" />
                            </div>
                            <div className="space-y-2">
                                 <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1">Descripción de la Orden</label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-accent/40 border-border/50 h-12 rounded-xl px-4 focus:ring-primary font-medium" required placeholder="Ej: Gestor de Torneos Arcanos" />
                            </div>

                            <div className="md:col-span-2 space-y-4">
                                <label className="text-[10px] font-black font-montserrat uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Shield className="w-3 h-3" />
                                    Privilegios Concedidos
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-accent/20 p-6 rounded-xl border border-border/30">
                                    {permissionsList.map((perm) => (
                                        <div key={perm.id} className="flex items-center space-x-3 group cursor-pointer" onClick={() => togglePermission(perm.id)}>
                                            <div className={cn(
                                                "w-5 h-5 rounded border-2 flex items-center justify-center transition-all",
                                                form.permission_ids.includes(perm.id)
                                                    ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20"
                                                    : "border-border/50 bg-accent/40 group-hover:border-primary/50"
                                            )}>
                                                {form.permission_ids.includes(perm.id) && <Plus className="w-3 h-3" />}
                                            </div>
                                            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">{perm.display_name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="md:col-span-2 flex gap-4 pt-4">
                                <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase tracking-widest h-14 rounded-xl shadow-xl shadow-primary/20 font-montserrat">
                                    {submitting ? 'Sellando...' : editingRoleId ? 'Actualizar Rango' : 'Inscribir Rango'}
                                </Button>
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRoleId(null); }} className="flex-1 border-border/50 text-muted-foreground hover:bg-accent h-14 rounded-xl font-black uppercase tracking-widest font-montserrat">
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xl shadow-black/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-muted-foreground font-literata">
                        <thead className="bg-accent/40 border-b border-border text-[9px] font-black uppercase tracking-[0.3em] font-montserrat text-muted-foreground/60">
                            <tr>
                                <th className="px-8 py-6 w-10">
                                    <input type="checkbox" checked={allSelected} onChange={selectAll} className="w-5 h-5 rounded-lg border-border bg-accent text-primary focus:ring-primary cursor-pointer" />
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('id')}>
                                    <div className="flex items-center gap-1">ID <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'id' && "opacity-100 text-primary")} /></div>
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Jerarquía (Rango) <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'name' && "opacity-100 text-primary")} /></div>
                                </th>
                                <th className="px-6 py-6 font-black cursor-pointer hover:text-primary transition-colors group" onClick={() => handleSort('created_at')}>
                                    <div className="flex items-center gap-1">Origen <ArrowUpDown className={cn("w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity", sortBy === 'created_at' && "opacity-100 text-primary")} /></div>
                                </th>
                                <th className="px-6 py-6 font-black text-right">Atributos Concedidos</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/30">
                            {roles.map((r) => (
                                <tr key={r.id} className={cn(
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
                                                {r.deleted_at && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[7px] font-black h-4 px-1 rounded uppercase tracking-[0.2em]">Exiliado</Badge>
                                                )}
                                            </div>
                                            <span className="text-[11px] text-muted-foreground/50 leading-relaxed italic">{r.description || 'Este rango aún no ha sido descrito.'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-6">
                                        <div className="flex flex-wrap justify-end gap-1.5 max-w-md">
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
                                    <td className="px-6 py-6 text-center">
                                        {r.deleted_at ? (
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg bg-destructive/10 text-destructive border-destructive/20">Exiliado</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg bg-primary/10 text-primary border-primary/20">Vigente</Badge>
                                        )}
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
                        label: 'Exiliar',
                        icon: <UserMinus className="w-4 h-4" />,
                        onClick: handleBulkDelete,
                        className: 'text-warning-600 hover:text-warning-700',
                    },
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
                    }
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
