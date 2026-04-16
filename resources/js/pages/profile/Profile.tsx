import React, { useState, useEffect, useRef, useCallback } from 'react';
import apiService from '@/services/ApiService';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Image as ImageIcon, MapPin, BookOpen, Handshake, Save, Loader2, Shield, Upload, X, Trophy, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

// ── Tipos ────────────────────────────────────────────────────────────────────

interface ImageDropZoneProps {
    label: string;
    currentUrl: string;
    previewUrl: string | null;
    onFileSelected: (file: File) => void;
    onClear: () => void;
    aspectClass: string;
    hint?: string;
}

// ── Componente reutilizable de Drag & Drop ────────────────────────────────────

function ImageDropZone({ label, currentUrl, previewUrl, onFileSelected, onClear, aspectClass, hint }: ImageDropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const displayUrl = previewUrl || currentUrl;

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            onFileSelected(file);
        }
    }, [onFileSelected]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) onFileSelected(file);
    };

    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {label}
            </label>

            <div
                className={`relative ${aspectClass} w-full rounded-lg overflow-hidden cursor-pointer group
                    border-2 transition-all duration-200
                    ${isDragging
                        ? 'border-amber-500 bg-amber-500/5'
                        : 'border-zinc-700/60 hover:border-zinc-600 bg-background'
                    }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {displayUrl ? (
                    <>
                        <img
                            src={displayUrl}
                            alt={label}
                            className="w-full h-full object-cover"
                        />
                        {/* Overlay hover */}
                        <div className="absolute inset-0 bg-background opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                            <Upload className="h-6 w-6 text-amber-400" />
                            <span className="text-xs text-zinc-300 font-medium">Cambiar imagen</span>
                            <span className="text-xs text-zinc-500">Arrastra o haz clic</span>
                        </div>
                        {/* Botón quitar */}
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onClear(); }}
                            className="absolute top-2 right-2 p-1 rounded-md bg-background border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </>
                ) : (
                    /* Estado vacío */
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4">
                        <div className={`p-3 rounded-full border-2 border-dashed transition-colors ${isDragging ? 'border-amber-500 bg-amber-500/10' : 'border-zinc-700'}`}>
                            <Upload className={`h-5 w-5 transition-colors ${isDragging ? 'text-amber-400' : 'text-zinc-600'}`} />
                        </div>
                        <div className="text-center">
                            <p className="text-xs font-medium text-zinc-400">
                                {isDragging ? 'Suelta la imagen aquí' : 'Arrastra una imagen o haz clic'}
                            </p>
                            {hint && <p className="text-xs text-zinc-600 mt-0.5">{hint}</p>}
                        </div>
                    </div>
                )}

                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleFileChange}
                    onClick={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}

// ── Página principal del Perfil ───────────────────────────────────────────────

export default function Profile() {
    const { user: authUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [hasProfile, setHasProfile] = useState(false);
    const [reputation, setReputation] = useState(0);

    const [formData, setFormData] = useState({
        display_name: '',
        bio: '',
        country: '',
        trade_terms: '',
        avatar_url: '',
        banner_url: '',
    });

    // Archivos seleccionados (null = sin cambios)
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [bannerFile, setBannerFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [bannerPreview, setBannerPreview] = useState<string | null>(null);

    // Mercado
    const [myListings, setMyListings] = useState<any[]>([]);
    const [myTransactions, setMyTransactions] = useState<any[]>([]);

    // ── Cargar perfil ────────────────────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await apiService.axiosInstance.get('/api/profile');
                const userData = response.data.user;

                if (userData.profile) {
                    setHasProfile(true);
                    setReputation(userData.reputation);
                    setFormData({
                        display_name: userData.profile.display_name || '',
                        bio: userData.profile.bio || '',
                        country: userData.profile.country || '',
                        trade_terms: userData.profile.trade_terms || '',
                        avatar_url: userData.profile.avatar_url || '',
                        banner_url: userData.profile.banner_url || '',
                    });
                }

                // Cargar datos del mercado
                const [listingsRes, transRes] = await Promise.all([
                    apiService.getMyMarketListings(),
                    apiService.getMarketTransactions()
                ]);
                setMyListings(listingsRes);
                setMyTransactions(transRes.data);

            } catch (error) {
                console.error('Error al cargar datos del perfil/mercado:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleCancelListing = async (id: number) => {
        try {
            await apiService.cancelMarketListing(id);
            toast.success('Anuncio cancelado');
            setMyListings(myListings.filter(l => l.id !== id));
        } catch (error) {
            toast.error('Error al cancelar el anuncio');
        }
    };

    // Limpiar object URLs al desmontar
    useEffect(() => {
        return () => {
            if (avatarPreview) URL.revokeObjectURL(avatarPreview);
            if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        };
    }, [avatarPreview, bannerPreview]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarSelected = (file: File) => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
    };

    const handleBannerSelected = (file: File) => {
        if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        setBannerFile(file);
        setBannerPreview(URL.createObjectURL(file));
    };

    const clearAvatar = () => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview(null);
        setFormData(prev => ({ ...prev, avatar_url: '' }));
    };

    const clearBanner = () => {
        if (bannerPreview) URL.revokeObjectURL(bannerPreview);
        setBannerFile(null);
        setBannerPreview(null);
        setFormData(prev => ({ ...prev, banner_url: '' }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            const payload = new FormData();

            payload.append('display_name', formData.display_name);
            payload.append('bio', formData.bio);
            payload.append('country', formData.country);
            payload.append('trade_terms', formData.trade_terms);

            if (avatarFile) {
                payload.append('avatar', avatarFile);
            } else {
                payload.append('avatar_url', formData.avatar_url);
            }

            if (bannerFile) {
                payload.append('banner', bannerFile);
            } else {
                payload.append('banner_url', formData.banner_url);
            }

            if (hasProfile) {
                payload.append('_method', 'PATCH');
            }

            const response = await apiService.axiosInstance.post('/api/profile', payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const profile = response.data.user.profile;

            // Actualizar URLs con las devueltas por el servidor
            setFormData(prev => ({
                ...prev,
                avatar_url: profile.avatar_url || '',
                banner_url: profile.banner_url || '',
            }));

            if (!hasProfile) setHasProfile(true);

            // Limpiar previsualizaciones
            setAvatarFile(null);
            setBannerFile(null);
            if (avatarPreview) { URL.revokeObjectURL(avatarPreview); setAvatarPreview(null); }
            if (bannerPreview) { URL.revokeObjectURL(bannerPreview); setBannerPreview(null); }

            setMessage({ text: hasProfile ? 'Perfil actualizado con éxito.' : 'Perfil creado con éxito.', type: 'success' });

        } catch (error) {
            console.error('Error guardando perfil:', error);
            setMessage({ text: 'Ha ocurrido un error al guardar los datos.', type: 'error' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    // ── Loading ──────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                </div>
            </>
        );
    }

    const displayAvatar = avatarPreview || formData.avatar_url;
    const displayBanner = bannerPreview || formData.banner_url;

    return (
        <>
            <Breadcrumbs items={[{ title: 'Mi Perfil', href: '/profile' }]} />
            {/* ── BANNER ─────────────────────────────────────────────────── */}
            <div className="relative h-56 bg-background">
                <div className="absolute inset-0 overflow-hidden">
                    {displayBanner ? (
                        <img src={displayBanner} alt="Banner" className="w-full h-full object-cover opacity-50" />
                    ) : (
                        <div
                            className="w-full h-full"
                            style={{
                                background: 'radial-gradient(ellipse at 60% 40%, #27272a 0%, #09090b 70%)',
                                backgroundImage: 'radial-gradient(ellipse at 60% 40%, #27272a 0%, #09090b 70%), radial-gradient(circle, #3f3f46 1px, transparent 1px)',
                                backgroundSize: 'auto, 28px 28px',
                            }}
                        />
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-zinc-950 to-transparent" />
                </div>

                <div className="absolute bottom-0 left-0 right-0 translate-y-1/2">
                    <div className="max-w-4xl mx-auto px-6 md:px-8 flex items-end gap-5">
                        <div className="relative flex-shrink-0">
                            <div className="h-28 w-28 rounded-lg bg-background ring-4 ring-zinc-950 overflow-hidden shadow-2xl">
                                {displayAvatar ? (
                                    <img src={displayAvatar} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-background flex items-center justify-center">
                                        <User className="h-10 w-10 text-zinc-600" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-amber-500 ring-2 ring-zinc-950" />
                        </div>
                        <div className="pb-2 min-w-0">
                            <h1 className="text-2xl md:text-3xl font-serif font-bold text-zinc-100 truncate leading-tight">
                                {formData.display_name || authUser?.name || 'Viajero Desconocido'}
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
                                    <Shield className="h-3 w-3" />
                                    Reputación: {reputation}
                                </span>
                                <Link
                                    to="/achievements"
                                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-background border border-zinc-700 text-zinc-400 hover:text-amber-400 hover:border-amber-500/40 text-xs font-semibold uppercase tracking-wider transition-colors"
                                >
                                    <Trophy className="h-3 w-3" />
                                    Logros
                                </Link>
                                {formData.country && (
                                    <span className="inline-flex items-center gap-1 text-zinc-500 text-xs">
                                        <MapPin className="h-3 w-3" />
                                        {formData.country}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── FORMULARIO ─────────────────────────────────────────────── */}
            <div className="max-w-4xl mx-auto px-6 md:px-8 pt-20 pb-16">
                <div className="border-t border-zinc-800/60 mb-8" />

                {message.text && (
                    <div className={`p-4 mb-8 rounded-md border text-sm ${message.type === 'success'
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400'
                            : 'bg-red-950/30 border-red-500/30 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* ── Bloque 1: Identidad ── */}
                    <section className="bg-background border border-zinc-800/80 rounded-lg p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/60">
                            <div className="p-1.5 rounded-md bg-background">
                                <User className="h-4 w-4 text-zinc-400" />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-zinc-100">
                                Identidad del Planeswalker
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                                    Nombre a Mostrar <span className="text-amber-500">*</span>
                                </label>
                                <Input
                                    name="display_name"
                                    value={formData.display_name}
                                    onChange={handleChange}
                                    placeholder="Ej: Jace Beleren"
                                    className="bg-background border-zinc-700/60 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 text-zinc-100 placeholder:text-zinc-600 h-10"
                                    required
                                />
                                <p className="text-xs text-zinc-600 leading-relaxed">
                                    Nombre público visible en el foro y el mercado.
                                </p>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5" /> País / Plano de Origen
                                </label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Ej: Ravnica / España"
                                    className="bg-background border-zinc-700/60 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 text-zinc-100 placeholder:text-zinc-600 h-10"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ── Bloque 2: Apariencia con Drag & Drop ── */}
                    <section className="bg-background border border-zinc-800/80 rounded-lg p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/60">
                            <div className="p-1.5 rounded-md bg-background">
                                <ImageIcon className="h-4 w-4 text-zinc-400" />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-zinc-100">
                                Apariencia
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                            <ImageDropZone
                                label="Avatar"
                                currentUrl={formData.avatar_url}
                                previewUrl={avatarPreview}
                                onFileSelected={handleAvatarSelected}
                                onClear={clearAvatar}
                                aspectClass="aspect-square"
                                hint="JPG, PNG, WEBP · Máx 2 MB"
                            />
                            <ImageDropZone
                                label="Banner de Fondo"
                                currentUrl={formData.banner_url}
                                previewUrl={bannerPreview}
                                onFileSelected={handleBannerSelected}
                                onClear={clearBanner}
                                aspectClass="aspect-video"
                                hint="JPG, PNG, WEBP · Máx 5 MB · Recomendado 1200×400"
                            />
                        </div>

                        {/* Indicador de archivos pendientes */}
                        {(avatarFile || bannerFile) && (
                            <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-500/5 border border-amber-500/20 text-amber-400 text-xs">
                                <Upload className="h-3.5 w-3.5 flex-shrink-0" />
                                <span>
                                    {[avatarFile && 'avatar', bannerFile && 'banner']
                                        .filter(Boolean)
                                        .join(' y ')} pendiente{(avatarFile && bannerFile) ? 's' : ''} de guardar
                                </span>
                            </div>
                        )}
                    </section>

                    {/* ── Bloque 3: Biografía y Comercio ── */}
                    <section className="bg-background border border-zinc-800/80 rounded-lg p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/60">
                            <div className="p-1.5 rounded-md bg-background">
                                <BookOpen className="h-4 w-4 text-zinc-400" />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-zinc-100">
                                Biografía y Comercio
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                                    Sobre mí
                                </label>
                                <Textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Cuenta tu historia en el multiverso..."
                                    className="bg-background border-zinc-700/60 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 text-zinc-100 placeholder:text-zinc-600 min-h-[110px] resize-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Handshake className="h-3.5 w-3.5" /> Términos de Intercambio
                                </label>
                                <Textarea
                                    name="trade_terms"
                                    value={formData.trade_terms}
                                    onChange={handleChange}
                                    placeholder="Ej: Solo envío certificado. No acepto cartas en idioma asiático."
                                    className="bg-background border-zinc-700/60 focus-visible:ring-amber-500/50 focus-visible:border-amber-500/50 text-zinc-100 placeholder:text-zinc-600 min-h-[110px] resize-none"
                                />
                            </div>
                        </div>
                    </section>
                    
                    {/* ── Bloque 4: Mercado Secundario ── */}
                    <section className="bg-background border border-zinc-800/80 rounded-lg p-6 md:p-8 space-y-6">
                        <div className="flex items-center gap-2.5 pb-4 border-b border-zinc-800/60">
                            <div className="p-1.5 rounded-md bg-background">
                                <TrendingUp className="h-4 w-4 text-emerald-400" />
                            </div>
                            <h2 className="text-lg font-serif font-bold text-zinc-100">
                                Mercado Secundario
                            </h2>
                        </div>

                        {/* Anuncios Activos */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                                Mis Anuncios Activos ({myListings.length})
                            </h3>
                            {myListings.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic">No tienes anuncios activos en este momento.</p>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {myListings.map(listing => (
                                        <div key={listing.id} className="flex gap-4 p-3 bg-background border border-zinc-700/40 rounded-lg items-center group">
                                            <div className="h-16 w-12 rounded border border-zinc-800 overflow-hidden flex-shrink-0">
                                                <img 
                                                    src={listing.listable.image_uri || listing.listable.image_url || '/placeholder-card.png'} 
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-zinc-100 truncate">{listing.listable.name}</p>
                                                <p className="text-xs text-emerald-400 font-bold">{listing.price_total}€</p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                size="sm" 
                                                className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400"
                                                onClick={() => handleCancelListing(listing.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Historial de Transacciones */}
                        <div className="space-y-4 pt-4 border-t border-zinc-800/60">
                            <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                                Historial Reciente (Ventas/Compras)
                            </h3>
                            {myTransactions.length === 0 ? (
                                <p className="text-zinc-500 text-sm italic">No has realizado transacciones aún.</p>
                            ) : (
                                <div className="space-y-3">
                                    {myTransactions.map(trans => (
                                        <div key={trans.id} className="flex justify-between items-center text-sm p-2 border-b border-zinc-800/40">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-1.5 h-1.5 rounded-full ${trans.seller_id === authUser?.id ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                                <span className="text-zinc-300">
                                                    {trans.seller_id === authUser?.id ? 'Venta de' : 'Compra de'} <strong>{trans.item_details?.name || 'Item'}</strong>
                                                </span>
                                            </div>
                                            <span className={trans.seller_id === authUser?.id ? 'text-emerald-400 font-bold' : 'text-zinc-100'}>
                                                {trans.seller_id === authUser?.id ? '+' : '-'}{trans.price_total}€
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── Botón Guardar ── */}
                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:border-amber-500/60 px-7 py-2.5 rounded-md font-semibold text-sm tracking-wide transition-all duration-200 disabled:opacity-40"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Tejiendo hechizo...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Perfil
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </>
    );
}
