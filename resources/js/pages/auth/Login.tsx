import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Layers, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import ReCAPTCHA from 'react-google-recaptcha';
import { useLogin } from '@/hooks/useLogin';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    _canResetPassword?: boolean;
    _status?: string;
}

export default function Login({ _canResetPassword = false, _status }: Props) {
    const navigate = useNavigate();
    const recaptchaRef = useRef<any>(null);
    const [showPassword, setShowPassword] = useState(false);

    // Extraemos todo el estado y lógica del hook centralizado
    const { isAuthenticated, formData, errors, loading, handleChange, handleSubmit } = useLogin();

    // Redirigir automáticamente si ya está autenticado
    React.useEffect(() => {
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
            handleSubmit(), // Llamamos a la lógica del hook
            {
                loading: 'Resolviendo hechizo de invocación...',
                success: () => {
                    navigate('/dashboard', { replace: true });
                    return '¡Invocación exitosa! Bienvenido de nuevo, Planeswalker.';
                },
                error: (err: any) => {
                    // Limpiar reCAPTCHA en caso de error
                    if (recaptchaRef.current) recaptchaRef.current.reset();
                    handleChange('recaptcha_token', '');

                    if (err.response?.data?.errors) {
                        return 'Tu hechizo ha sido contrarrestado (revisa tus datos)';
                    }
                    return err.response?.data?.message || 'Fallo de conexión con el Multiverso';
                },
            },
        );
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />

            <Card className="w-full max-w-md bg-card border-border text-foreground z-10 shadow-2xl">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-3 bg-primary rounded-xl shadow-lg shadow-primary/30 transform transition-transform hover:scale-105">
                            <Layers className="h-6 w-6 text-primary-foreground" />
                        </div>
                    </div>
                    <CardTitle className="text-3xl text-center font-bold bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
                        Tienda Magic
                    </CardTitle>
                    <CardDescription className="text-center text-muted-foreground">
                        Accede a tu bóveda del Multiverso
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={submit} className="space-y-4">
                        {errors.general && (
                            <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-200 text-sm text-center">
                                {errors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground">Email de Plainswalker</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                className="bg-accent border-border text-foreground focus:border-primary/50 placeholder:text-muted-foreground"
                                placeholder="tu@email.com"
                                disabled={loading}
                                required
                            />
                            {errors.email && <p className="text-xs text-red-500">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground">Grimorio (Contraseña)</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    className="bg-accent border-border text-foreground focus:border-primary/50 placeholder:text-muted-foreground"
                                    placeholder="••••••••"
                                    disabled={loading}
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground hover:bg-transparent hover:text-primary"
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-xs text-red-500">{errors.password[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={formData.remember}
                                onCheckedChange={(checked) => handleChange('remember', !!checked)}
                                className="border-border data-[state=checked]:bg-primary"
                                disabled={loading}
                            />
                            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">Mantener portal abierto</Label>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4 bg-accent rounded-lg border border-border">
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
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold transition-all duration-200"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 animate-spin" /> Resolviendo stack...
                                </span>
                            ) : 'Entrar a la Bóveda'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4 border-t border-border mt-4 pt-6">
                    <div className="text-center text-sm text-muted-foreground">
                        ¿Aún no tienes tu Chispa?{' '}
                        <Link to="/register" className="text-primary hover:text-primary/80 transition-colors underline-offset-4 hover:underline">
                            Forja tu mazo aquí
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
