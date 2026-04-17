import React, { useState, useEffect, useId } from 'react';
import apiService from '@/services/ApiService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose,
} from "@/components/ui/dialog";
import { 
    User, MapPin, BookOpen, 
    Loader2, Shield, Trophy, 
    ArrowRight, Pencil, Calendar,
    Check, Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Hooks & Sub-components
import { useCharacterLimit } from "@/hooks/use-character-limit";
import { ProfileBg, AvatarEditor } from "./components/EditorComponents";

export default function Profile() {
    const { user: authUser } = useAuth();
    const id = useId();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [hasProfile, setHasProfile] = useState(false);
    const [reputation, setReputation] = useState(0);

    const [formData, setFormData] = useState({
        display_name: '', country: '', avatar_url: '', banner_url: '',
    });

    // Bio with character limit
    const maxLength = 240;
    const {
        value: bio,
        characterCount,
        handleChange: handleBioChange,
        maxLength: limit,
        setValue: setBioValue
    } = useCharacterLimit({ maxLength, initialValue: "" });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiService.axiosInstance.get('/api/profile');
                const userData = response.data.user;
                if (userData.profile) {
                    setHasProfile(true); 
                    setReputation(userData.reputation || userData.profile.reputation_score || 0);
                    setFormData({
                        display_name: userData.profile.display_name || '',
                        country: userData.profile.country || '',
                        avatar_url: userData.profile.avatar_url || '',
                        banner_url: userData.profile.banner_url || '',
                    });
                    setBioValue(userData.profile.bio || '');
                } else {
                    // Si no tiene perfil, usamos el nombre de la cuenta por defecto
                    setFormData(prev => ({ 
                        ...prev, 
                        display_name: userData.name || userData.username || '' 
                    }));
                }
            } catch (error) { console.error(error); } finally { setLoading(false); }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async () => {
        // Verificar límites de tamaño (PHP default es 2MB)
        const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
        
        if (avatarFile && avatarFile.size > MAX_FILE_SIZE) {
            toast.error('La imagen de perfil es demasiado grande. El límite es 2MB.');
            return;
        }
        if (bannerFile && bannerFile.size > MAX_FILE_SIZE) {
            toast.error('El banner es demasiado grande. El límite del servidor es 2MB.');
            return;
        }

        setSaving(true);
        try {
            const p = new FormData();
            
            // Verificación robusta del nombre (obligatorio en backend)
            const finalName = formData.display_name.trim() || authUser?.name || authUser?.username || 'Planeswalker';
            p.append('display_name', finalName); 
            
            // Bio y País (opcionales pero enviados como string para evitar undefined)
            p.append('bio', bio || '');
            p.append('country', formData.country || '');
            
            // Archivos (solo si hay nuevos seleccionados)
            if (avatarFile) p.append('avatar', avatarFile);
            if (bannerFile) p.append('banner', bannerFile);
            
            // Método spoofing para Laravel en actualizaciones
            if (hasProfile) p.append('_method', 'PATCH');
            
            const res = await apiService.axiosInstance.post('/api/profile', p, { 
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    'Accept': 'application/json' 
                } 
            });
            
            const prof = res.data.user.profile;
            setFormData({ 
                display_name: prof.display_name, 
                country: prof.country || '',
                avatar_url: prof.avatar_url, 
                banner_url: prof.banner_url 
            });
            setBioValue(prof.bio || '');
            setHasProfile(true); 
            setIsDialogOpen(false);
            toast.success('Perfil de Planeswalker actualizado');
        } catch (error: any) { 
            console.error('Error detallado de validación:', error.response?.data);
            
            // Extraer mensajes de error específicos de Laravel
            const serverErrors = error.response?.data?.errors;
            if (serverErrors) {
                const errorMessages = Object.values(serverErrors).flat().join(' ');
                toast.error(`Error de validación: ${errorMessages}`);
            } else {
                toast.error(error.response?.data?.message || 'Error al conectar con el santuario (servidor)');
            }
        } finally { 
            setSaving(false); 
        }
    };

    if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="flex-1 bg-background text-foreground pb-20 font-literata animate-in fade-in duration-500">
            
            <div className="max-w-5xl mx-auto px-4 pt-12">
                 {/* HERO SECTION */}
                <div className="relative mb-8">
                    <div className="h-44 md:h-64 rounded-xl overflow-hidden border border-border bg-card shadow-sm group relative">
                        {formData.banner_url ? (
                            <img src={formData.banner_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center">
                                 <Shield size={48} className="text-accent/20 opacity-10" />
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
                        
                        {/* EDIT BUTTON */}
                        <div className="absolute top-4 right-4 z-20">
                             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" className="bg-background/40 backdrop-blur-md border-white/10 text-foreground hover:bg-background/80 font-black uppercase tracking-widest text-[10px] gap-2 px-4 h-9 shadow-xl">
                                        <Pencil className="h-3 w-3" /> Editar Perfil
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="flex flex-col gap-0 overflow-y-visible p-0 sm:max-w-lg [&>button:last-child]:top-3.5">
                                    <DialogHeader className="contents space-y-0 text-left">
                                        <DialogTitle className="border-b border-border px-6 py-4 text-base font-montserrat font-black uppercase tracking-tight">
                                            Identidad del Planeswalker
                                        </DialogTitle>
                                    </DialogHeader>
                                    <DialogDescription className="sr-only">Modifica tus datos públicos y apariencia.</DialogDescription>
                                    <div className="overflow-y-auto max-h-[75vh]">
                                        <ProfileBg defaultImage={formData.banner_url} onFileSelected={(f) => setBannerFile(f)} />
                                        <AvatarEditor defaultImage={formData.avatar_url} onFileSelected={(f) => setAvatarFile(f)} />
                                        <div className="px-6 pb-6 pt-4">
                                            <div className="space-y-4 font-literata">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nombre Público</Label>
                                                        <Input 
                                                            value={formData.display_name} 
                                                            placeholder="Tu nombre en el Multiverso"
                                                            onChange={(e) => setFormData({...formData, display_name: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plano de Origen</Label>
                                                        <Input 
                                                            value={formData.country} 
                                                            placeholder="Ej: Ravnica, Dominaria..."
                                                            onChange={(e) => setFormData({...formData, country: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Biografía</Label>
                                                    <Textarea 
                                                        value={bio} 
                                                        maxLength={maxLength} 
                                                        placeholder="Narra brevemente tus hazañas..."
                                                        onChange={handleBioChange} 
                                                        className="resize-none h-24" 
                                                    />
                                                    <p className="mt-2 text-right text-[10px] font-black uppercase text-muted-foreground/60 tabular-nums">{limit - characterCount} car. restantes</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="border-t border-border px-6 py-4 bg-accent/5">
                                        <DialogClose asChild><Button type="button" variant="ghost" className="text-[10px] font-black uppercase tracking-widest">Cancelar</Button></DialogClose>
                                        <Button 
                                            type="button" 
                                            onClick={handleSubmit} 
                                            disabled={saving} 
                                            className="text-[10px] font-black uppercase tracking-widest lg:px-8 shadow-lg shadow-primary/20"
                                        >
                                            {saving ? <Loader2 className="animate-spin h-3 w-3 mr-2" /> : <Check className="h-3 w-3 mr-2" />} 
                                            Guardar Cambios
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </div>
                    
                    {/* Header info overlap */}
                    <div className="-mt-16 flex flex-col items-center relative z-10 px-4">
                        <div className="relative size-32 md:size-40 rounded-3xl border-4 border-background bg-card shadow-2xl overflow-hidden mb-6">
                            {formData.avatar_url ? <img src={formData.avatar_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center bg-accent/10"><User size={64} className="text-muted-foreground opacity-20" /></div>}
                        </div>
                        
                        <div className="text-center space-y-3">
                             <h1 className="text-4xl md:text-6xl font-forum font-bold text-foreground uppercase tracking-tight leading-tight">
                                {formData.display_name || authUser?.name || authUser?.username}
                             </h1>
                             <div className="flex items-center justify-center gap-3 text-[10px] text-primary font-black uppercase tracking-[0.4em] opacity-80">
                                <MapPin size={12} /> {formData.country || 'Caminante de Planos'}
                             </div>
                        </div>
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="max-w-2xl mx-auto space-y-16 mt-16 px-4">
                     <section className="text-center space-y-8">
                         <div className="flex items-center justify-center gap-4 text-muted-foreground/20">
                             <div className="h-px w-16 bg-gradient-to-r from-transparent to-border" />
                             <BookOpen className="w-5 h-5" />
                             <div className="h-px w-16 bg-gradient-to-l from-transparent to-border" />
                         </div>
                         <p className="text-xl md:text-3xl text-foreground italic leading-relaxed font-literata tracking-tight">
                             "{bio || "Este viajero cruza los planos en busca de cartas legendarias..."}"
                         </p>
                     </section>

                     <section className="space-y-10">
                         <div className="flex flex-col items-center gap-8">
                             <div className="flex items-center gap-4">
                                 <div className="h-px w-8 bg-border" />
                                 <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.5em]">Logros Cruzados</h2>
                                 <div className="h-px w-8 bg-border" />
                             </div>
                             
                             <Link to="/achievements" className="w-full flex items-center justify-between p-6 bg-card/40 hover:bg-card border border-border rounded-xl transition-all group shadow-sm">
                                 <div className="flex items-center gap-4">
                                     <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform shadow-inner border border-primary/5">
                                         <Trophy className="h-6 w-6 text-primary" />
                                     </div>
                                     <div className="text-left">
                                         <span className="block text-sm font-black uppercase tracking-widest text-foreground">Salón de la Fama</span>
                                         <span className="block text-[10px] text-muted-foreground font-medium mt-1 uppercase tracking-widest opacity-60">Ver todas mis medallas</span>
                                     </div>
                                 </div>
                                 <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                             </Link>
                         </div>
                     </section>

                     {/* FOOTER METADATA */}
                     <section className="pt-20 pb-10 border-t border-border/40 flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                         <div className="flex flex-col items-center gap-2 group cursor-default">
                             <Shield size={20} className="text-primary group-hover:scale-110 transition-transform" />
                             <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reputación</p>
                                 <p className="text-lg font-montserrat font-black text-foreground">{reputation}</p>
                             </div>
                         </div>
                         <div className="flex flex-col items-center gap-2 group cursor-default">
                             <Calendar size={20} className="text-primary group-hover:scale-110 transition-transform" />
                             <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Miembro desde</p>
                                 <p className="text-lg font-montserrat font-black text-foreground">{new Date(authUser?.created_at || Date.now()).getFullYear()}</p>
                             </div>
                         </div>
                         <div className="hidden md:flex flex-col items-center gap-2 group cursor-default">
                             <Info size={20} className="text-primary group-hover:scale-110 transition-transform" />
                             <div className="text-center">
                                 <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Firma Digital</p>
                                 <p className="text-lg font-montserrat font-black text-foreground">#{authUser?.id}</p>
                             </div>
                         </div>
                     </section>
                </div>
            </div>
        </div>
    );
}
