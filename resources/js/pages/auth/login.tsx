import { Form, Head, router, useForm } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { Turnstile } from '@marsidev/react-turnstile';

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
}

export default function Login({
    status,
    canResetPassword,
    canRegister,
}: LoginProps) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
        turnstile_token: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', {
            onFinish: () => reset('password'),
        });
    };

    return (
      <AuthLayout
        title="Log in to your account"
        description="Enter your email and password below to log in"
      >
        <Head title="Log in" />

        <form onSubmit={submit} className="flex flex-col gap-6">
          <div className="grid gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => setData('email', e.target.value)}
                required
                autoFocus
                tabIndex={1}
                autoComplete="email"
                placeholder="email@example.com"
              />
              <InputError message={errors.email} />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password">Password</Label>
                {canResetPassword && (
                <TextLink
                  href="/password/reset"
                  className="ml-auto text-sm"
                  tabIndex={5}
                >
                    Forgot password?
                </TextLink>
                                )}
              </div>
              <Input
                id="password"
                type="password"
                value={data.password}
                onChange={(e) => setData('password', e.target.value)}
                required
                tabIndex={2}
                autoComplete="current-password"
                placeholder="Password"
              />
              <InputError message={errors.password} />
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="remember"
                checked={data.remember}
                onCheckedChange={(checked) => setData('remember', !!checked)}
                tabIndex={3}
              />
              <Label htmlFor="remember">Remember me</Label>
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
                        const input = document.getElementById('turnstile_token_input') as HTMLInputElement;
                        if (input) {
                            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
                            nativeInputValueSetter?.call(input, token);
                            const event = new Event('input', { bubbles: true });
                            input.dispatchEvent(event);
                        }
                    }}
                />
                <InputError message={errors.turnstile_token} className="mt-2" />
            </div>

            <Button
              type="submit"
              className="mt-4 w-full"
              tabIndex={4}
              disabled={processing}
              data-test="login-button"
            >
              {processing && <Spinner />}
              Log in
            </Button>
          </div>

          {canRegister && (
            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?
              {' '}
              <TextLink href="/register" tabIndex={5}>
                Sign up
              </TextLink>
            </div>
                        )}
        </form>

        {status && (
        <div className="mb-4 text-center text-sm font-medium text-green-600">
          {status}
        </div>
            )}
      </AuthLayout>
    );
}
