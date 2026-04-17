import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
 Eye, EyeOff, Layers, Sparkles, ShieldCheck,
} from 'lucide-react';
import { GiLotus } from 'react-icons/gi';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import { useLogin } from '@/hooks/useLogin';
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

interface Props {
  _canResetPassword?: boolean;
  _status?: string;
}

export default function Login({ _canResetPassword = false, _status }: Props) {
    const navigate = useNavigate();
    const recaptchaRef = useRef<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Lógica existente
    const {
 isAuthenticated, formData, errors, loading, handleChange, handleSubmit,
} = useLogin();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, navigate]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.recaptcha_token) {
            toast.error('Demuestra que eres un jugador y no una ilusión (completa el reCAPTCHA)');
            return;
        }

        toast.promise(
            handleSubmit(),
            {
                loading: 'Resolviendo hechizo de invocación...',
                success: () => {
                    navigate('/dashboard', { replace: true });
                    return '¡Invocación exitosa! Bienvenido de nuevo, Planeswalker.';
                },
                error: (err: any) => {
                    if (recaptchaRef.current) recaptchaRef.current.reset();
                    handleChange('recaptcha_token', '');
                    return err.response?.data?.message || 'Fallo de conexión con el Multiverso';
                },
            },
        );
    };

    return (
        <div className="h-screen flex flex-col md:flex-row w-full overflow-hidden font-montserrat">

            {/* COLUMNA IZQUIERDA: FORMULARIO */}
            <section className="flex-1 flex items-center justify-center p-6 md:p-12 relative overflow-y-auto custom-scrollbar">
                {/* Theme Toggler */}
                <div className="absolute top-8 right-8 z-20">
                    <AnimatedThemeToggler />
                </div>

                {/* Fondo sutil */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--color-primary),transparent)] opacity-[0.03] pointer-events-none" />

                <div className="w-full max-w-md z-10">
                    <div className="flex flex-col gap-8">
                        {/* Logo / Header */}
                        <div className="animate-element animate-delay-100 flex flex-col gap-4">
                            <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-xl shadow-primary/30 transform transition-transform hover:scale-110 active:scale-95 cursor-pointer">
                                <GiLotus className="h-8 w-8 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tighter uppercase">
                                    Bienvenido
{' '}
<span className="text-primary italic">Planeswalker</span>
                                </h1>
                                <p className="text-muted-foreground text-sm font-bold uppercase tracking-[0.2em] mt-2 opacity-70">
                                    Accede a tu Bóveda de Black Lotus
                                </p>
                            </div>
                        </div>

                        {/* Formulario */}
                        <form className="space-y-6" onSubmit={submit}>
                            <div className="animate-element animate-delay-200">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block">
                                    Portal de Identificación (Email)
                                </label>
                                <GlassInputWrapper error={errors.email}>
                                    <input
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleChange('email', e.target.value)}
                                        placeholder="tu@email.com"
                                        className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-foreground font-medium"
                                        required
                                    />
                                </GlassInputWrapper>
                                {errors.email && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase">{errors.email[0]}</p>}
                            </div>

                            <div className="animate-element animate-delay-300">
                                <div className="flex justify-between items-center mb-2 ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        Grimorio (Contraseña)
                                    </label>
                                </div>
                                <GlassInputWrapper error={errors.password}>
                                    <div className="relative">
                                        <input
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            value={formData.password}
                                            onChange={(e) => handleChange('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-foreground font-medium"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-4 flex items-center transition-colors hover:text-primary text-muted-foreground"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </GlassInputWrapper>
                                {errors.password && <p className="text-[10px] text-red-500 font-bold mt-1.5 ml-1 uppercase">{errors.password[0]}</p>}
                            </div>

                            <div className="animate-element animate-delay-400 flex items-center justify-between">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={formData.remember}
                                        onChange={(e) => handleChange('remember', e.target.checked)}
                                        className="custom-checkbox"
                                    />
                                    <span className="text-[11px] font-black uppercase tracking-widest text-foreground/70 group-hover:text-foreground transition-colors">
                                        Mantener portal abierto
                                    </span>
                                </label>
                                <Link to="/register" className="text-[11px] font-black uppercase tracking-widest text-primary hover:scale-105 transition-transform no-underline">
                                    ¿Olvidaste tu hechizo?
                                </Link>
                            </div>

                            {/* ReCAPTCHA */}
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
                                disabled={loading}
                                className="animate-element animate-delay-600 w-full rounded-2xl bg-primary py-5 font-black text-primary-foreground uppercase tracking-widest text-xs hover:bg-primary/90 transition-all active:scale-[0.98] shadow-xl shadow-primary/20 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Sparkles className="w-4 h-4 animate-spin" />
                                        Invocando...
                                    </>
                                ) : (
                                    <>
                                        Entrar a la Bóveda
                                        <ShieldCheck className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="animate-element animate-delay-700 text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            ¿Aún no tienes tu Chispa?
{' '}
                            <Link to="/register" className="text-primary hover:underline transition-all">
                                Forja tu mazo aquí
                            </Link>
                        </p>
                    </div>
                </div>
            </section>

            {/* COLUMNA DERECHA: HERO IMAGE */}
            <section className="hidden lg:block flex-1 relative overflow-hidden bg-card">
                {/* Imagen de Fondo Premium */}
                <div
                    className="animate-slide-right animate-delay-300 absolute inset-0 bg-cover bg-center group"
                    style={{ backgroundImage: 'url(\'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=1600&q=80\')' }}
                >
                    {/* Overlay de Gradiente Suave para Mezclar */}
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent opacity-80" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
                </div>
            </section>
        </div>
    );
}
