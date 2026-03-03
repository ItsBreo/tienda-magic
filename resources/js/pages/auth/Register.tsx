import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Usamos React Router
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import axios from 'axios';

// Cambiamos Turnstile por reCAPTCHA de nuevo
import ReCAPTCHA from 'react-google-recaptcha';

export default function RegisterWithProvider() {
    const navigate = useNavigate();
    const recaptchaRef = useRef<ReCAPTCHA>(null); // Para resetear tras errores

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        recaptcha_token: '', // Volvemos a recaptcha_token
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [generalError, setGeneralError] = useState<string | null>(null);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) setErrors((prev: any) => ({ ...prev, [field]: null }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setGeneralError(null);
        setErrors({});

        try {
            // Aseguramos cookies CSRF antes de enviar
            await axios.get('/sanctum/csrf-cookie');

            // Enviamos vía API (Axios)
            const response = await axios.post('/api/register', formData);

            console.log("🎉 Registro exitoso:", response.data.message);

            // Redirigimos al dashboard
            navigate('/dashboard', { replace: true });

        } catch (err: any) {
            console.error("🛑 Error en el registro:", err.response?.data);

            // Reiniciamos el captcha de Google para que el usuario pueda volver a intentarlo
            if (recaptchaRef.current) {
                recaptchaRef.current.reset();
            }
            handleChange('recaptcha_token', '');

            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else {
                setGeneralError(err.response?.data?.message || 'Error al registrarse. Inténtalo de nuevo.');
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
                    <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
                    <CardDescription className="text-center">
                        Únete a la comunidad de Magic
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {generalError && (
                        <Alert className="mb-4 border-red-200 bg-red-50">
                            <AlertDescription className="text-red-800">{generalError}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={submit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre Completo</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={(e) => handleChange('name', e.target.value)}
                                placeholder="Tu nombre completo"
                                required
                            />
                            {errors.name && <p className="text-sm text-red-600">{errors.name[0]}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de Usuario</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={(e) => handleChange('username', e.target.value)}
                                placeholder="@usuario"
                                required
                            />
                            {errors.username && <p className="text-sm text-red-600">{errors.username[0]}</p>}
                        </div>

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

                        <div className="space-y-2">
                            <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    value={formData.password_confirmation}
                                    onChange={(e) => handleChange('password_confirmation', e.target.value)}
                                    placeholder="••••••••"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            {errors.password_confirmation && <p className="text-sm text-red-600">{errors.password_confirmation[0]}</p>}
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
                            {processing ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                    </form>
                </CardContent>

                <CardFooter className="flex flex-col space-y-4">
                    <div className="text-center text-sm text-gray-600">
                        ¿Ya tienes cuenta? <Link to="/login" className="text-blue-600 underline">Inicia sesión aquí</Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
