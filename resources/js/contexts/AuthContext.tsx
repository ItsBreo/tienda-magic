import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    ReactNode,
} from 'react';
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
    // Empezamos en true SOLO si ya tenemos token guardado, evitando el flash innecesario
    const [isLoading, setIsLoading] = useState(() => apiService.isAuthenticated());

    const isAuthenticated = !!user;

    // Al montar: si hay token en localStorage, verificamos que siga siendo válido
    useEffect(() => {
        if (!apiService.isAuthenticated()) {
            // Sin token → no hay nada que verificar, cargamos directo
            setIsLoading(false);
            return;
        }

        const initializeAuth = async () => {
            try {
                const userData = await apiService.checkAuth();
                setUser(userData);
            } catch {
                // Token inválido o expirado → el interceptor ya limpió el token
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
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        setIsLoading(true);
        try {
            // apiService.login ya guarda el token en localStorage internamente
            const authResponse = await apiService.login(credentials);
            setUser(authResponse.data);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout(); // también elimina el token del localStorage
        } catch {
            // Si falla la petición, limpiamos igualmente en cliente
            apiService.removeToken();
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    const contextValue = useMemo(
        () => ({ user, isLoading, isAuthenticated, login, logout, checkAuth }),
        [user, isLoading, isAuthenticated],
    );

    return (
        <AuthContext.Provider value={contextValue}>
            {isLoading ? (
                <div className="min-h-screen flex items-center justify-center bg-zinc-900">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
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
