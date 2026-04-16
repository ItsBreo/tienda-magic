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
    role_name?: string;
    two_factor_enabled?: boolean;
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
    refreshUser: () => Promise<void>;
    updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(() => apiService.isAuthenticated());

    const isAuthenticated = !!user;

    useEffect(() => {
        const initializeAuth = async () => {
            // Si no hay token, no hacemos nada
            if (!apiService.isAuthenticated()) {
                setIsLoading(false);
                return;
            }

            try {
                // Llamamos al endpoint para verificar y obtener datos del usuario
                const userData = await apiService.checkAuth();
                setUser(userData);
            } catch (error) {
                console.error('Error al verificar sesión:', error);
                // Si falla la verificación, limpiamos el token
                apiService.removeToken();
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
        try {
            const authResponse = await apiService.login(credentials);

            // Manejo seguro de 2FA sin redirección hardcodeada
            if (authResponse.two_factor_required) {
                // Lanzar error específico para manejo en UI
                throw new Error('TWO_FACTOR_REQUIRED');
            }

            setUser(authResponse.data);
        } catch (error: any) {
            if (error.message === 'TWO_FACTOR_REQUIRED') {
                throw error; // Propagar para manejo en componente
            }
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await apiService.logout();
        } catch {
            apiService.removeToken();
        } finally {
            setUser(null);
            window.location.href = '/login';
        }
    };

    const updateUser = (userData: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...userData });
        }
    };

    const contextValue = useMemo(
        () => ({ user, isLoading, isAuthenticated, login, logout, checkAuth, refreshUser: checkAuth, updateUser }),
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
