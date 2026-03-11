import React, { useState, useEffect } from 'react';
import apiService from '@/services/ApiService';
import TiendaMagicLayout from '@/layouts/tienda-magic-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { User, Image as ImageIcon, MapPin, BookOpen, Handshake, Save, Loader2, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Profile() {
    const { user: authUser } = useAuth(); // Sacamos los datos básicos del contexto

    // Estados para la carga y el guardado
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Bandera para saber si hacemos POST (crear) o PATCH (actualizar)
    const [hasProfile, setHasProfile] = useState(false);
    const [reputation, setReputation] = useState(0);

    // Estado del formulario
    const [formData, setFormData] = useState({
        display_name: '',
        avatar_url: '',
        banner_url: '',
        bio: '',
        country: '',
        trade_terms: ''
    });

    // 1. OBTENER LOS DATOS AL CARGAR LA PÁGINA
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // Llamamos a la ruta protegida que creamos en api.php
                const response = await apiService.axiosInstance.get('/api/profile');
                const userData = response.data.user;

                if (userData.profile) {
                    setHasProfile(true);
                    setReputation(userData.profile.reputation_score);
                    setFormData({
                        display_name: userData.profile.display_name || '',
                        avatar_url: userData.profile.avatar_url || '',
                        banner_url: userData.profile.banner_url || '',
                        bio: userData.profile.bio || '',
                        country: userData.profile.country || '',
                        trade_terms: userData.profile.trade_terms || ''
                    });
                }
            } catch (error) {
                console.error('Error al cargar el perfil del Multiverso:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    // 2. MANEJAR LOS CAMBIOS EN LOS INPUTS
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // 3. GUARDAR EL PERFIL
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ text: '', type: '' });

        try {
            if (hasProfile) {
                // Si ya tiene perfil, actualizamos (PATCH)
                await apiService.axiosInstance.patch('/api/profile', formData);
                setMessage({ text: 'Perfil actualizado con éxito en la base de datos.', type: 'success' });
            } else {
                // Si no tiene perfil, lo creamos (POST)
                await apiService.axiosInstance.post('/api/profile', formData);
                setHasProfile(true);
                setMessage({ text: 'Perfil creado con éxito.', type: 'success' });
            }
        } catch (error) {
            console.error('Error guardando perfil:', error);
            setMessage({ text: 'Ha ocurrido un error al guardar los datos.', type: 'error' });
        } finally {
            setSaving(false);
            // Ocultar mensaje después de 3 segundos
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        }
    };

    if (loading) {
        return (
            <TiendaMagicLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                </div>
            </TiendaMagicLayout>
        );
    }

    return (
        <TiendaMagicLayout breadcrumbs={[{ title: 'Mi Perfil', href: '/profile' }]}>

            {/* CABECERA VISUAL (El Banner) */}
            <div className="relative h-64 bg-zinc-900 border-b border-zinc-800 overflow-hidden">
                {formData.banner_url ? (
                    <img src={formData.banner_url} alt="Banner" className="w-full h-full object-cover opacity-60" />
                ) : (
                    <div className="w-full h-full bg-zinc-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-zinc-950 opacity-50"></div>
                )}

                {/* Foto de Perfil Superpuesta */}
                <div className="absolute -bottom-12 left-8 md:left-16 flex items-end gap-6">
                    <div className="h-32 w-32 rounded-sm bg-zinc-950 border-4 border-zinc-950 overflow-hidden shadow-xl">
                        {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full bg-zinc-800 flex items-center justify-center">
                                <User className="h-12 w-12 text-zinc-600" />
                            </div>
                        )}
                    </div>
                    <div className="mb-14">
                        <h1 className="text-3xl font-serif font-bold text-zinc-100 drop-shadow-md">
                            {formData.display_name || authUser?.name || 'Viajero Desconocido'}
                        </h1>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold uppercase tracking-wider">
                                <Shield className="h-3.5 w-3.5" />
                                Reputación: {reputation}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* FORMULARIO DE EDICIÓN */}
            <div className="max-w-4xl mx-auto px-6 pt-24 pb-16">

                {/* Alerta de Mensaje */}
                {message.text && (
                    <div className={`p-4 mb-8 rounded-sm border ${message.type === 'success' ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-400' : 'bg-red-950/30 border-red-500/30 text-red-400'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">

                    {/* Bloque 1: Información Básica */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 md:p-8">
                        <h2 className="text-xl font-serif font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                            <User className="h-5 w-5 text-zinc-500" />
                            Identidad del Planeswalker
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-1">
                                    Nombre a Mostrar
                                    <span className="text-amber-500" title="Campo obligatorio">*</span>
                                </label>
                                <Input
                                    name="display_name"
                                    value={formData.display_name}
                                    onChange={handleChange}
                                    placeholder="Ej: Jace Beleren"
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100"
                                    required // Esto bloquea el botón de guardar si está vacío
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                    Este es el nombre público que verán otros jugadores en el foro y el mercado.
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <MapPin className="h-4 w-4" /> País / Plano de Origen
                                </label>
                                <Input
                                    name="country"
                                    value={formData.country}
                                    onChange={handleChange}
                                    placeholder="Ej: Ravnica / España"
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bloque 2: Imágenes */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 md:p-8">
                        <h2 className="text-xl font-serif font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                            <ImageIcon className="h-5 w-5 text-zinc-500" />
                            Apariencia
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">URL del Avatar</label>
                                <Input
                                    name="avatar_url"
                                    type="url"
                                    value={formData.avatar_url}
                                    onChange={handleChange}
                                    placeholder="https://ejemplo.com/mi-avatar.jpg"
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">URL del Banner de Fondo</label>
                                <Input
                                    name="banner_url"
                                    type="url"
                                    value={formData.banner_url}
                                    onChange={handleChange}
                                    placeholder="https://ejemplo.com/paisaje.jpg"
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bloque 3: Biografía y Comercio */}
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-sm p-6 md:p-8">
                        <h2 className="text-xl font-serif font-bold text-zinc-100 mb-6 flex items-center gap-2 border-b border-zinc-800 pb-4">
                            <BookOpen className="h-5 w-5 text-zinc-500" />
                            Biografía y Comercio
                        </h2>

                        <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Sobre mí</label>
                                <Textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleChange}
                                    placeholder="Cuenta tu historia en el multiverso..."
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 min-h-[100px]"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Handshake className="h-4 w-4" /> Términos de Intercambio
                                </label>
                                <Textarea
                                    name="trade_terms"
                                    value={formData.trade_terms}
                                    onChange={handleChange}
                                    placeholder="Ej: Solo envío certificado. No acepto cartas en idioma asiático."
                                    className="bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500 text-zinc-100 min-h-[100px]"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Botón de Guardado */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="submit"
                            disabled={saving}
                            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 border border-amber-500/30 px-8 py-6 rounded-sm font-bold text-md transition-all disabled:opacity-50"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Tejiendo hechizo...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-5 w-5" />
                                    Guardar Perfil
                                </>
                            )}
                        </Button>
                    </div>

                </form>
            </div>
        </TiendaMagicLayout>
    );
}
