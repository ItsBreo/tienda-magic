import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
 Eye, EyeOff, Layers, Sparkles, UserPlus, Lock,
} from 'lucide-react';
import { GiLotus } from 'react-icons/gi';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import apiService from '@/services/ApiService';
import { cn } from '@/lib/utils';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

// --- SUB-COMPONENTES DE DISEÑO ---

function GlassInputWrapper({ children, error }: { children: React.ReactNode, error?: any }) {
  return (
<div className={cn(
    'rounded-2xl border bg-foreground/5 backdrop-blur-sm transition-all duration-300',
    error ? 'border-red-500/50 bg-red-500/5' : 'border-border focus-within:border-primary/70 focus-within:bg-primary/5 shadow-sm',
  )}>
    {children}
  </div>
);
}

export default function Register() {
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    // Lógica y estados existentes
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: null }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.recaptcha_token) {
            toast.error('Por favor, demuestra que no eres un token de artefacto (completa el reCAPTCHA)');
            return;
        }

        setProcessing(true);
        setErrors({});

        const registerRequest = apiService.register(formData);

        toast.promise(registerRequest, {
            loading: 'Encendiendo tu Chispa de Planeswalker...',
            success: (_response) => {
                navigate('/dashboard', { replace: true });
                return '¡Chispa encendida! Bienvenido al Multiverso.';
            },
            error: (err: any) => {
                setProcessing(false);
                if (recaptchaRef.current) recaptchaRef.current.reset();
                handleChange('recaptcha_token', '');

                if (err.response?.data?.errors) {
                    setErrors(err.response.data.errors);
                    if (err.response.data.errors.username) return 'Ese nombre de usuario ya está siendo usado.';
                    if (err.response.data.errors.email) return 'Ese email ya está registrado.';
                    return 'Revisa tu mano inicial (errores en el formulario)';
                }
                return err.response?.data?.message || 'Fallo al resolver el hechizo.';
            },
        });
    };

    return (
        <div className="h-screen flex flex-col md:flex-row w-full overflow-hidden font-montserrat">

            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <section className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
                {/* Theme Toggler */}
                <div className="absolute top-8 right-8 z-20">
                    <AnimatedThemeToggler />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary),transparent)] opacity-[0.03] pointer-events-none" />

                <div className="w-full max-w-md z-10 py-10">
                    <div className="flex flex-col gap-8">
                        {/* Logo / Header */}
                        <div className="animate-element animate-delay-100 flex flex-col gap-4">
                            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 transform transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                                <GiLotus className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">
                                    Forja tu
{' '}
<span className="text-primary italic">Destino</span>
                                </h1>
                                <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] mt-2 opacity-70">
                                    Únete al Multiverso de Black Lotus
                                </p>
                            </div>
                        </div>

                        {/* Formulario */}
                        <form className="space-y-5" onSubmit={submit}>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="animate-element animate-delay-200">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Nombre Real</label>
                                    <GlassInputWrapper error={errors.name}>
                                        <input
                                            value={formData.name}
                                            onChange={(e) => handleChange('name', e.target.value)}
                                            placeholder="Tu nombre"
                                            className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-foreground font-medium"
                                            required
                                        />
                                    </GlassInputWrapper>
                                    {errors.name && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.name[0]}</p>}
                                </div>
                                <div className="animate-element animate-delay-200">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Mote (User)</label>
                                    <GlassInputWrapper error={errors.username}>
                                        <input
                                            value={formData.username}
                                            onChange={(e) => handleChange('username', e.target.value)}
                                            placeholder="@usuario"
                                            className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-foreground font-medium"
                                            required
                                        />
                                    </GlassInputWrapper>
                                    {errors.username && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.username[0]}</p>}
                                </div>
                            </div>

                            <div className="animate-element animate-delay-300">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Canal de Contacto (Email)</label>
                                <GlassInputWrapper error={errors.email}>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full bg-transparent text-sm p-3.5 rounded-2xl focus:outline-none text-foreground font-medium"
                                        required
                                    />
                                </GlassInputWrapper>
                                {errors.email && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.email[0]}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="animate-element animate-delay-400">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Grimorio</label>
                                    <GlassInputWrapper error={errors.password}>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => handleChange('password', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-transparent text-sm p-3.5 pr-10 rounded-2xl focus:outline-none text-foreground font-medium"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </GlassInputWrapper>
                                    {errors.password && <p className="text-[9px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.password[0]}</p>}
                                </div>
                                <div className="animate-element animate-delay-400">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">Confirmación</label>
                                    <GlassInputWrapper error={errors.password_confirmation}>
                                        <div className="relative">
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.password_confirmation}
                                                onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                                placeholder="••••••••"
                                                className="w-full bg-transparent text-sm p-3.5 pr-10 rounded-2xl focus:outline-none text-foreground font-medium"
                                                required
                                            />
                                            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors">
                                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </GlassInputWrapper>
                                </div>
                            </div>

                            <div className="animate-element animate-delay-500 p-4 bg-accent/30 rounded-2xl border border-border flex justify-center">
                                <ReCAPTCHA
                                    ref={recaptchaRef}
                                    theme="dark"
                                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                    onChange={(token) => handleChange('recaptcha_token', token || '')}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-5 font-black text-primary-foreground uppercase tracking-widest text-xs hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        Iniciando Spark...
                                    </>
                                ) : (
                                    <>
                                        Crear Cuenta de Planeswalker
                                        <UserPlus className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="animate-element animate-delay-700 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            ¿Ya tienes cuenta?
{' '}
                            <Link to="/login" className="text-primary hover:underline transition-all">
                                Gira tus tierras e inicia sesión
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* COLUMNA DERECHA: HERO IMAGE */}
            <section className="hidden lg:block flex-1 relative overflow-hidden bg-card">
                <div
                    className="animate-slide-right animate-delay-300 absolute inset-0 bg-cover bg-center group"
                    style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1549490349-8643362247b5?w=1600&q=80\')' }}
                >
                    {/* Overlay de Gradiente */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                </div>
            </section>
        </div>
    );
}
