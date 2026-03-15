import axios, { AxiosInstance } from 'axios';

interface LoginCredentials {
    email: string;
    password: string;
    remember?: boolean;
    recaptcha_token?: string;
}

interface RegisterData {
    name: string;
    username: string;
    email: string;
    password: string;
    password_confirmation: string;
    recaptcha_token?: string;
    remember?: boolean;
}

const TOKEN_KEY = 'auth_token';

class MagicApi {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            // Sin withCredentials: ya no dependemos de cookies de sesión
        });

        // Interceptor de REQUEST: inyecta el JWT en cada petición automáticamente
        this.api.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Interceptor de RESPONSE: si el token expiró/es inválido, limpia y redirige
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.removeToken();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            },
        );
    }

    // ─── Gestión del token ────────────────────────────────────────────────────

    getToken(): string | null {
        return localStorage.getItem(TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(TOKEN_KEY, token);
    }

    removeToken(): void {
        localStorage.removeItem(TOKEN_KEY);
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    // ─── Auth ─────────────────────────────────────────────────────────────────

    async login(credentials: LoginCredentials): Promise<any> {
        const response = await this.api.post('/api/login', credentials);
        // El backend devuelve { token, data: user }
        const { token } = response.data;
        if (token) this.setToken(token);
        return response.data;
    }

    async register(data: RegisterData): Promise<any> {
        const response = await this.api.post('/api/register', data);
        const { token } = response.data;
        if (token) this.setToken(token);
        return response.data;
    }

    async logout(): Promise<void> {
        try {
            // Invalida el token en el servidor
            await this.api.post('/api/logout');
        } finally {
            this.removeToken();
        }
    }

    async checkAuth(): Promise<any> {
        const response = await this.api.get('/api/user');
        return response.data;
    }

    // ─── Recursos ─────────────────────────────────────────────────────────────

    async getPacks(page: number = 1, sort: string = ''): Promise<any> {
        const response = await this.api.get('/api/shop', { params: { page, sort } });
        return response.data;
    }

    async getCardsBySet(setCode: string): Promise<any[]> {
        const response = await this.api.get(`/api/cards/set/${setCode}`);
        return response.data;
    }

    get axiosInstance(): AxiosInstance {
        return this.api;
    }
}

export const apiService = new MagicApi();
export default apiService;
