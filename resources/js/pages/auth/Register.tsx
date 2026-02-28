import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { GuestRoute } from '@/components/ProtectedRoute';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';

export default function RegisterWithProvider() {
    const { login: authLogin } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        username: '',
        email: '',
        password: '',
        password_confirmation: '',
        turnstile_token: '',
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        try {
            // Usar el endpoint de registro normal
            await post('/register', {
                onFinish: () => reset('password', 'password_confirmation'),
            });
        } catch (err: any) {
            setError(err.email || err.password || err.name || err.username || 'Error al registrarse');
        }
    };

    return (
        <GuestRoute>
            <Head title="Registro" />
            
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
                        {error && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertDescription className="text-red-800">{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Tu nombre completo"
                                    required
                                    autoComplete="name"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="username">Nombre de Usuario</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    value={data.username}
                                    onChange={(e) => setData('username', e.target.value)}
                                    placeholder="@usuario"
                                    required
                                    autoComplete="username"
                                />
                                <InputError message={errors.username} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="email"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation">Confirmar Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password_confirmation"
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <InputError message={errors.password_confirmation} />
                            </div>

                            <div className="flex flex-col items-center justify-center py-4">
                                <Input
                                    type="hidden"
                                    name="turnstile_token"
                                    id="turnstile_token_input"
                                />
                                <Turnstile
                                    siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
                                    onSuccess={(token) => {
                                        setData('turnstile_token', token);
                                    }}
                                />
                                <InputError message={errors.turnstile_token} className="mt-2" />
                            </div>

                            <Button 
                                type="submit" 
                                className="w-full" 
                                disabled={processing}
                            >
                                {processing ? 'Creando cuenta...' : 'Crear Cuenta'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <div className="text-center text-sm text-gray-600">
                            ¿Ya tienes cuenta?{' '}
                            <a
                                href="/login"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Inicia sesión aquí
                            </a>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </GuestRoute>
    );
}
