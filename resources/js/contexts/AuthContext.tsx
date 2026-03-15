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

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                // Al tener withCredentials: true, Axios enviará la cookie automáticamente.
                // Si la sesión es válida, devolverá el usuario. Si no, lanzará error 401.
                const userData = await apiService.checkAuth();
                setUser(userData);
            } catch (error: any) {
                // Si hay error (ej. 401), asumimos que no hay sesión
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const userData = await apiService.checkAuth();
            setUser(userData);
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
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
            // Ignorar
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    const contextValue = useMemo(() => {
        return { user, isLoading, isAuthenticated, login, logout, checkAuth };
    }, [user, isLoading, isAuthenticated]);

    return (
        <AuthContext.Provider value={contextValue}>
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
