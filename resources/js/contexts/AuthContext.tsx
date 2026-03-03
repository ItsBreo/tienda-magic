import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';

// Configuración global de Axios para trabajar con Laravel Sanctum/Sessions
axios.defaults.baseURL = 'http://127.0.0.1:8000'; // Asegúrate de que coincida con tu URL de Laravel
axios.defaults.withCredentials = true; // Crucial para enviar/recibir cookies de sesión
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

interface User {
    id: number;
    name: string;
    username: string;
    email: string;
    wallet_balance?: number;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string, remember?: boolean, turnstile_token?: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isAuthenticated = !!user;

    // 1. Verificar autenticación al cargar la App
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Llamamos a la ruta de la API que definimos en api.php
            const response = await axios.get('/api/user');
            setUser(response.data);
        } catch (error: any) {
            // Si es 401 (no autenticado), simplemente ponemos el usuario en null
            // sin llenar la consola de errores innecesarios
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string, remember = false, recaptcha_token?: string) => {
        setIsLoading(true);
        try {
            // Primero, inicializamos la protección CSRF de Sanctum (Solo necesario una vez)
            await axios.get('/sanctum/csrf-cookie');

            // Enviamos los datos al nuevo LoginController API
            const response = await axios.post('/api/login', {
                email,
                password,
                remember,
                recaptcha_token
            });

            if (response.data.two_factor) {
                // Si el controlador devuelve que necesita 2FA, podrías manejarlo aquí
                // Por ahora, lanzamos un aviso o redirigimos
                window.location.href = '/two-factor-challenge';
            } else {
                setUser(response.data.user);
            }
        } catch (error: any) {
            // Re-lanzamos el error para que el componente Login lo capture y muestre
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await axios.post('/api/logout');
            setUser(null);
            window.location.href = '/login'; // Redirigir al salir
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
