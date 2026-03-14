import React, {
 createContext, useContext, useState, useEffect, useMemo, ReactNode,
} from 'react';
import apiService from '@/services/ApiService';

// --- Interfaces y Tipos
interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    wallet_balance?: number;
    is_admin?: boolean;
}

interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
    recaptcha_token?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (_credentials: LoginCredentials) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null); // Estado para almacenar datos del usuario autenticado
    const [isLoading, setIsLoading] = useState(true); // Estado para indicar si se está verificando la autenticación

    const isAuthenticated = !!user;

    // 1. Verificar autenticación al cargar la App (ejecutar solo una vez)
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Comprobar si existe token en localStorage o sessionStorage
                const token = localStorage.getItem('token') || sessionStorage.getItem('token');

                if (token) {
                    // Si existe token, configuramos cabecera global y verificamos con endpoint JWT
                    apiService.axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                    try {
                        const userData = await apiService.checkAuth();
                        setUser(userData);
                    } catch (error: any) {
                        // Si el endpoint devuelve 401, limpiamos el token
                        if (error.response?.status === 401) {
                            localStorage.removeItem('token');
                            sessionStorage.removeItem('token');
                            delete apiService.axiosInstance.defaults.headers.common['Authorization'];
                            setUser(null);
                        }
                        // Para otros errores (red, servidor), mantenemos el token
                    }
                }
            } catch (error) {
                // Error general, limpiamos todo
                localStorage.removeItem('token');
                sessionStorage.removeItem('token');
                delete apiService.axiosInstance.defaults.headers.common['Authorization'];
                setUser(null);
            } finally {
                // Siempre detener el loading, haya éxito o error
                setIsLoading(false);
            }
        };

        // Siempre ejecutar inicialización para manejar rehidratación
        initializeAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Usar servicio API
            const userData = await apiService.checkAuth();
            setUser(userData);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            // Usar servicio API para login
            const authResponse = await apiService.login(credentials);

            if (authResponse.two_factor) {
                window.location.href = '/two-factor-challenge';
            } else {
                setUser(authResponse.data);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch (error) {
            // Ignorar error de logout, limpiar de todos modos
        } finally {
            // Limpiamos tokens de ambos storages
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');

            // Eliminamos cabecera global
            delete apiService.axiosInstance.defaults.headers.common['Authorization'];

            setUser(null);
            window.location.href = '/login';
        }
    };

    const contextValue = useMemo(() => {
        return {
            user,
            isLoading,
            isAuthenticated,
            login,
            logout,
            checkAuth,
        };
    }, [user, isLoading, isAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {/* Mostrar pantalla de carga global mientras se verifica autenticación */}
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                        <p className="text-zinc-100 text-lg">Verificando tu sesión...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
