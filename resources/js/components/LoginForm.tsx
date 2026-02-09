import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';

interface LoginFormProps {
    formData: {
        email: string;
        password: string;
        remember: boolean;
    };
    errors: {
        email?: string;
        password?: string;
        general?: string;
    };
    loading: boolean;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    canResetPassword?: boolean;
}

export default function LoginForm({
    formData,
    errors,
    loading,
    onSubmit,
    onChange,
    canResetPassword = true,
}: LoginFormProps) {
    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-6">
            {/* Error general */}
            {errors.general && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                </div>
            )}

            {/* Campo Email */}
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={onChange}
                    placeholder="ejemplo@correo.com"
                    disabled={loading}
                    required
                    autoFocus
                />
                <InputError message={errors.email} />
            </div>

            {/* Campo Contraseña */}
            <div className="grid gap-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Contraseña</Label>
                    {canResetPassword && (
                        <TextLink href="/forgot-password" className="text-sm">
                            ¿Olvidaste tu contraseña?
                        </TextLink>
                    )}
                </div>
                <Input
                    id="password"
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={onChange}
                    placeholder="••••••••"
                    disabled={loading}
                    required
                />
                <InputError message={errors.password} />
            </div>

            {/* Checkbox Recuérdame */}
            <div className="flex items-center gap-2">
                <Checkbox
                    id="remember"
                    name="remember"
                    checked={formData.remember}
                    onChange={onChange}
                    disabled={loading}
                />
                <Label htmlFor="remember" className="font-normal cursor-pointer">
                    Recuérdame
                </Label>
            </div>

            {/* Botón Submit */}
            <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                    <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Iniciando sesión...
                    </>
                ) : (
                    'Iniciar sesión'
                )}
            </Button>

            {/* Link a Registro */}
            <div className="text-center text-sm">
                ¿No tienes cuenta?{' '}
                <TextLink href="/register" className="font-semibold">
                    Regístrate aquí
                </TextLink>
            </div>
        </form>
    );
}
