import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';
import { Trash2, Plus, Loader2, Shield, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSelection } from '@/hooks/useSelection';
import BulkActionsToolbar from '@/components/admin/BulkActionsToolbar';

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

export default function AdminRoles() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissionsList, setPermissionsList] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<number | null>(null);

    // Form state
    const [form, setForm] = useState({
        name: '', 
        description: '',
        permission_ids: [] as number[]
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
    } = useSelection(roles);

    useEffect(() => {
        Promise.all([fetchRoles(), fetchPermissions()]);
    }, []);

    const fetchRoles = async () => {
        try {
            const { data } = await apiService.axiosInstance.get('/api/admin/roles');
            setRoles(data.data || data);
        } catch (error) {
            toast.error('Error al cargar roles');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            const data = await apiService.getAdminPermissions();
            setPermissionsList(data);
        } catch (error) {
            toast.error('Error al cargar lista de permisos');
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

    const handleBulkDelete = async () => {
        if (!window.confirm(`¿Seguro que deseas eliminar ${selectedCount} roles? Los roles protegidos del sistema no se borrarán.`)) return;
        try {
            const { data } = await apiService.axiosInstance.post('/api/admin/roles/bulk-delete', { ids: selectedList });
            toast.success(data.message);
            clear();
            fetchRoles();
        } catch (error) {
            toast.error('Error al realizar borrado masivo');
        }
    };

    const togglePermission = (id: number) => {
        setForm(prev => ({
            ...prev,
            permission_ids: prev.permission_ids.includes(id)
                ? prev.permission_ids.filter(pId => pId !== id)
                : [...prev.permission_ids, id]
        }));
    };

    const handleEdit = (role: Role) => {
        setEditingRoleId(role.id);
        setForm({
            name: role.name,
            description: role.description || '',
            permission_ids: role.permissions?.map(p => p.id) || []
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
                toast.success('Rol actualizado con sus nuevos permisos');
            } else {
                await apiService.axiosInstance.post('/api/admin/roles', form);
                toast.success('Rol creado correctamente');
            }
            setShowForm(false);
            setForm({ name: '', description: '', permission_ids: [] });
            setEditingRoleId(null);
            fetchRoles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error guardando rol');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="p-8 max-w-6xl mx-auto w-full">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Shield className="text-primary" /> Gestión de Roles y Permisos
                    </h1>
                    <p className="text-sm text-muted-foreground">Define qué acciones puede realizar cada grupo de usuarios en el sistema.</p>
                </div>
                <Button onClick={() => {
                    setEditingRoleId(null);
                    setForm({ name: '', description: '', permission_ids: [] });
                    setShowForm(!showForm);
                }} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                    <Plus className="w-4 h-4 mr-2" />
                    {showForm ? 'Cerrar Formulario' : 'Nuevo Rol'}
                </Button>
            </div>

            {showForm && (
                <div className="bg-card border border-border p-6 rounded-xl mb-8 shadow-xl animate-in fade-in slide-in-from-top-4 duration-300">
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                        {editingRoleId ? 'Editar Capacidades del Rol' : 'Configurar Nuevo Rol'}
                    </h2>
                    <form onSubmit={handleCreateOrUpdate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nombre del Rol</label>
                                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-accent border-border mt-1" required placeholder="Ej: Moderador Senior" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Descripción Breve</label>
                                <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="bg-accent border-border mt-1" placeholder="Ej: Gestión de hilos y usuarios..." />
                            </div>
                        </div>

                        <div className="border-t border-border pt-6">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 block">Asignar Permisos Específicos</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {permissionsList.map(perm => (
                                    <div 
                                        key={perm.id} 
                                        onClick={() => togglePermission(perm.id)}
                                        className={`group relative p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                                            form.permission_ids.includes(perm.id) 
                                            ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.1)]' 
                                            : 'bg-background border-border hover:border-primary/50'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`mt-1 h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                                                form.permission_ids.includes(perm.id) 
                                                ? 'bg-primary border-primary text-primary-foreground' 
                                                : 'border-muted-foreground/30 bg-accent'
                                            }`}>
                                                {form.permission_ids.includes(perm.id) && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>}
                                            </div>
                                            <div>
                                                <p className={`text-sm font-bold m-0 ${form.permission_ids.includes(perm.id) ? 'text-primary' : 'text-foreground'}`}>
                                                    {perm.display_name}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground m-0 mt-0.5 line-clamp-1">{perm.description || 'Sin descripción'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-8 flex gap-3">
                            <Button disabled={submitting} type="submit" className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12">
                                {submitting ? <Loader2 className="animate-spin" /> : (editingRoleId ? 'Guardar Cambios' : 'Crear Rol con Permisos')}
                            </Button>
                            {editingRoleId && (
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingRoleId(null); }} className="px-8 border-border text-muted-foreground hover:bg-accent h-12">
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
                            <th className="px-6 py-5 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={selectAll}
                                    className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                />
                            </th>
                            <th className="px-6 py-5 w-20">ID</th>
                            <th className="px-6 py-5">Nombre y Roles</th>
                            <th className="px-6 py-5">Permisos Actuales</th>
                            <th className="px-6 py-5 text-right w-32">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {roles.map((r) => (
                            <tr key={r.id} className={`group hover:bg-accent/30 transition-all duration-300 ${isSelected(r.id) ? 'bg-primary/5' : ''}`}>
                                <td className="px-6 py-5">
                                    <input
                                        type="checkbox"
                                        checked={isSelected(r.id)}
                                        onChange={() => toggle(r.id)}
                                        className="w-4 h-4 rounded border-border bg-accent text-primary focus:ring-primary"
                                    />
                                </td>
                                <td className="px-6 py-5 font-mono">#{r.id}</td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                        <span className="text-foreground font-bold mb-0.5 flex items-center gap-2">
                                            {r.name} 
                                            {r.name.toLowerCase() === 'super_admin' && <ShieldCheck className="w-4 h-4 text-primary" />}
                                        </span>
                                        <span className="text-xs text-muted-foreground">{r.description || 'Sin descripción'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex flex-wrap gap-1.5">
                                        {r.permissions && r.permissions.length > 0 ? (
                                            r.permissions.map(p => (
                                                <span key={p.id} className="px-2 py-0.5 rounded bg-accent text-[10px] text-muted-foreground border border-border whitespace-nowrap">
                                                    {p.display_name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-[10px] text-muted-foreground/60 italic">Sin permisos específicos</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-5 text-right whitespace-nowrap">
                                    <div className="flex justify-end items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleEdit(r)} 
                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 h-8 w-8 p-0"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 Z"></path></svg>
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => handleDelete(r.id)} 
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
                                        >
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
                        icon: <ShieldCheck className="w-4 h-4" />,
                        onClick: () => {
                            const roleToEdit = roles.find(r => r.id === selectedList[0]);
                            if (roleToEdit) handleEdit(roleToEdit);
                        },
                        className: 'text-primary hover:text-primary/80'
                    }] : []),
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
