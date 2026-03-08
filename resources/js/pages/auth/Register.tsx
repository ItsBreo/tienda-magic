import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Eye, EyeOff, Layers, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
 Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import apiService from '@/services/ApiService';

export default function Register() {
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

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

        // Usar servicio API
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

                    // Mensaje específico para username duplicado
                    if (err.response.data.errors.username) {
                        return 'Ese nombre de usuario ya está siendo usado por otro Planeswalker.';
                    }

                    // Mensaje específico para email duplicado
                    if (err.response.data.errors.email) {
                        return 'Ese email ya está registrado en el Multiverso.';
                    }

                    return 'Revisa tu mano inicial (errores en el formulario)';
                }
                return err.response?.data?.message || 'Fallo al resolver el hechizo. Inténtalo de nuevo.';
            },
        });
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden py-10">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/20 via-transparent to-transparent" />

            <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 z-10 shadow-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-900/40">
                            <Layers className="h-6 w-6 text-black" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-zinc-100 via-emerald-400 to-zinc-100 bg-clip-text text-transparent">
                        Crear Cuenta
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400">
                        Únete al Multiverso de coleccionistas
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-zinc-300">Nombre Completo</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500/50"
                                placeholder="Tu nombre completo"
                                required
                            />
                            {errors.name && <p className="text-xs text-red-500">{errors.name[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-zinc-300">Nombre de Usuario</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500/50"
                                placeholder="@usuario"
                                required
                            />
                            {errors.username && <p className="text-xs text-red-500">{errors.username[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500/50"
                                placeholder="tu@email.com"
                                required
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500/50"
                                    placeholder="••••••••"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-500 hover:bg-transparent hover:text-emerald-400"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation" className="text-zinc-300">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.password_confirmation}
                                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                    className="bg-zinc-800 border-zinc-700 text-white focus:border-emerald-500/50"
                                    placeholder="••••••••"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 text-zinc-500 hover:bg-transparent hover:text-emerald-400"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password_confirmation && <p className="text-xs text-red-500">{errors.password_confirmation[0]}</p>}
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                theme="dark"
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(token) => handleChange('recaptcha_token', token || '')}
                            />
                            {errors.recaptcha_token && (
                                <p className="text-xs text-red-500 mt-2">{errors.recaptcha_token[0]}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-black font-bold transition-all duration-200"
                            disabled={processing}
                        >
                            {processing ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 animate-spin" />
{' '}
Encendiendo Chispa...
</span>
                            ) : 'Crear Cuenta'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 border-t border-zinc-800/50 mt-4 pt-6">
                    <div className="text-center text-sm text-zinc-500">
                        ¿Ya tienes cuenta?
{' '}
                        <Link to="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors underline-offset-4 hover:underline">
                            Gira tus tierras e inicia sesión
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
