import { Head } from '@inertiajs/react';
import AuthLayout from '@/layouts/auth-layout';
import LoginForm from '@/components/LoginForm';
import { useLogin } from '@/hooks/useLogin';

interface LoginPageProps {
  status?: string;
  canResetPassword: boolean;
  canRegister: boolean;
}

/**
 * Página de Login
 *
 * Componente Contenedor que:
 * - Usa el hook useLogin para la lógica
 * - Pasa datos al componente presentacional LoginForm
 * - Maneja el layout general
 */
export default function LoginPage({
  status,
  canResetPassword,
  canRegister,
}: LoginPageProps) {
  const {
    formData, errors, loading, handleChange, handleSubmit,
  } = useLogin();

  return (
    <AuthLayout
      title="Inicia sesión en tu cuenta"
      description="Ingresa tu email y contraseña para continuar"
    >
      <Head title="Iniciar sesión" />

      {status && (
        <div className="mb-4 text-sm font-medium text-green-600">
          {status}
        </div>
      )}

      {/* Componente Presentacional */}
      <LoginForm
        formData={formData}
        errors={errors}
        loading={loading}
        onSubmit={handleSubmit}
        onChange={handleChange}
        canResetPassword={canResetPassword}
      />
    </AuthLayout>
  );
}
