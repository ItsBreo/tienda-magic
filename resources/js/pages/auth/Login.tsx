import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // SPA Navigation
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Wand2 } from 'lucide-react';

// Cambiamos Turnstile por reCAPTCHA
import ReCAPTCHA from 'react-google-recaptcha';

interface Props {
    canResetPassword?: boolean;
    status?: string;
}

export default function Login({ canResetPassword = false, status }: Props) {
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null);

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        remember: false,
        recaptcha_token: '',
    });

    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: null }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setGeneralError(null);
        setErrors({});

        try {
            await authLogin(
                formData.email,
                formData.password,
                formData.remember,
                formData.recaptcha_token
            );

            // Si el login es exitoso, redirigimos
            navigate('/dashboard', { replace: true });

        } catch (err: any) {
            console.error("🛑 Error en el login:", err.response?.data);

            // Reiniciamos el captcha en caso de error
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            handleChange('recaptcha_token', '');

            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setGeneralError(err.response?.data?.message || 'Error al iniciar sesión');
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1">
                    <div className="flex items-center justify-center mb-4">
                        <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
                            <Wand2 className="h-6 w-6 text-white" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-center">Tienda Magic</CardTitle>
                    <CardDescription className="text-center">
                        Inicia sesión para acceder a tu colección de cartas
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {(status || generalError) && (
                        <Alert className={`mb-4 ${generalError ? 'border-red-200 bg-red-50' : ''}`}>
                            <AlertDescription className={generalError ? 'text-red-800' : ''}>
                                {generalError || status}
                            </AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleChange('email', e.target.value)}
                                placeholder="tu@email.com"
                                required
                            />
                            {errors.email && <p className="text-sm text-red-600">{errors.email[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => handleChange('password', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password && <p className="text-sm text-red-600">{errors.password[0]}</p>}
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={formData.remember}
                                onCheckedChange={(checked) => handleChange('remember', !!checked)}
                            />
                            <Label htmlFor="remember" className="text-sm">Recordarme</Label>
                        </div>

                        <div className="flex flex-col items-center justify-center py-4">
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={(token) => handleChange('recaptcha_token', token || '')}
                            />
                            {errors.recaptcha_token && (
                                <p className="text-sm text-red-600 mt-2">{errors.recaptcha_token[0]}</p>
                            )}
                        </div>

                        <Button type="submit" className="w-full" disabled={processing}>
                            {processing ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-gray-600">
                        ¿No tienes cuenta?{' '}
                        <Link to="/register" className="text-blue-600 underline hover:text-blue-800">
                            Regístrate aquí
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
