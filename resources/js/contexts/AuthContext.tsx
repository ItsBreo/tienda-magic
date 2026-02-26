import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { router } from '@inertiajs/react';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    wallet_balance?: number;
    created_at?: string;
    updated_at?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, remember?: boolean) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // Verificar estado de autenticación al cargar
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const response = await fetch('/api/user', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.error('Error checking auth status:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, remember = false) => {
        setIsLoading(true);
        try {
            await router.post('/login', {
                email,
                password,
                remember,
            }, {
                onSuccess: () => {
                    // El usuario se actualizará automáticamente a través del middleware
                },
                onError: (errors) => {
                    console.error('Login errors:', errors);
                    throw errors;
                },
            });
        } catch (error) {
            setIsLoading(false);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await router.post('/logout');
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            isLoading,
            isAuthenticated,
            login,
            logout,
            checkAuth,
        }}>
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
