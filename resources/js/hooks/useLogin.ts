import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginErrors {
  email?: string[];
  password?: string[];
  recaptcha_token?: string[];
  general?: string;
}

interface LoginFormData {
  email: string;
  password: string;
  remember: boolean;
  recaptcha_token: string;
}

export function useLogin() {
  const { login } = useAuth(); // Usamos el contexto centralizado

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    remember: false,
    recaptcha_token: '',
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);

  // Manejo unificado de cambios en inputs y checkbox
  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Limpiar error específico cuando el usuario comienza a escribir
    if (errors[field as keyof LoginErrors]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  // Submit del formulario
  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    try {
      // Llamamos a la función login de AuthContext (que usa apiService)
      await login(formData);
      return { success: true };
    } catch (error: any) {
      const responseData = error.response?.data;

      // Mapear errores de validación de Laravel al estado local
      if (responseData?.errors) {
        setErrors(responseData.errors);
      } else {
        setErrors({
          general: responseData?.message || 'Error de conexión. Intenta de nuevo.',
        });
      }

      // Lanzamos el error para que la UI (toast) lo pueda capturar
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    errors,
    loading,
    handleChange,
    handleSubmit,
  };
}
