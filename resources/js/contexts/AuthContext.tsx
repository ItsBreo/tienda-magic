import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import apiService from '@/services/ApiService';

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
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // 1. Verificar autenticación al cargar la App (ejecutar solo una vez)
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Comprobar si existe token en localStorage o sessionStorage
                const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');

                if (token) {
                    // Si existe token, recuperar datos del usuario
                    const userData = await apiService.checkAuth();
                    setUser(userData);
                }
            } catch (error: any) {
                // Solo borrar token si es error 401 (Unauthorized)
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('client_token');
                    sessionStorage.removeItem('auth_token');
                    sessionStorage.removeItem('client_token');
                    setUser(null);
                } else {
                    // Para otros errores (red, servidor, etc), mantener el token
                    console.error('Error verificando autenticación:', error);
                }
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
        } catch (error: any) {
            // Si es 401, poner usuario en null
            setUser(null);
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
        } catch (error: any) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
            setUser(null);
            window.location.href = '/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const contextValue = useMemo(() => ({
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        checkAuth,
    }), [user, isLoading, isAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
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
