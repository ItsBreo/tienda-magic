import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Wand2 } from 'lucide-react';
import { GuestRoute } from '@/components/ProtectedRoute';
import InputError from '@/components/input-error';
import { useForm } from '@inertiajs/react';
import { Turnstile } from '@marsidev/react-turnstile';

interface Props {
    canResetPassword?: boolean;
    status?: string;
}

export default function LoginWithProvider({ canResetPassword = false, status }: Props) {
    const { login: authLogin } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        turnstile_token: '',
    });

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        
        try {
            await authLogin(data.email, data.password, data.remember);
        } catch (err: any) {
            setError(err.email || err.password || 'Error al iniciar sesión');
        }
    };

    return (
        <GuestRoute>
            <Head title="Iniciar Sesión" />
            
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
                        {status && (
                            <Alert className="mb-4">
                                <AlertDescription>{status}</AlertDescription>
                            </Alert>
                        )}
                        
                        {error && (
                            <Alert className="mb-4 border-red-200 bg-red-50">
                                <AlertDescription className="text-red-800">{error}</AlertDescription>
                            </Alert>
                        )}
                        
                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="tu@email.com"
                                    required
                                    autoComplete="username"
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
                                        autoComplete="current-password"
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

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="remember"
                                    checked={data.remember}
                                    onCheckedChange={(checked) => setData('remember', !!checked)}
                                />
                                <Label htmlFor="remember" className="text-sm">
                                    Recordarme
                                </Label>
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
                                {processing ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        {canResetPassword && (
                            <div className="text-center">
                                <a
                                    href="/password/reset"
                                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                                >
                                    ¿Olvidaste tu contraseña?
                                </a>
                            </div>
                        )}
                        
                        <div className="text-center text-sm text-gray-600">
                            ¿No tienes cuenta?{' '}
                            <a
                                href="/register"
                                className="text-blue-600 hover:text-blue-800 underline"
                            >
                                Regístrate aquí
                            </a>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </GuestRoute>
    );
}
