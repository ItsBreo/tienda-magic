import axios, { AxiosInstance, AxiosResponse } from 'axios';

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

class MagicApi {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: 'http://127.0.0.1:8000',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            // IMPORTANTE: Esto permite enviar y recibir cookies de sesión
            withCredentials: true,
        });

        // Interceptor de respuesta: maneja errores de autenticación 401
        this.api.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    // Ya no borramos localStorage, solo redirigimos si es necesario
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
                return Promise.reject(error);
            },
        );
    }

    /**
     * Inicializa protección CSRF. Obligatorio al usar sesiones basadas en cookies.
     */
    async initializeCSRF(): Promise<void> {
        await this.api.get('/sanctum/csrf-cookie');
    }

    async login(credentials: LoginCredentials): Promise<any> {
        // Obligatorio obtener la cookie CSRF antes de hacer un POST de login
        await this.initializeCSRF();

        const response = await this.api.post('/api/login', {
            ...credentials
        });

        return response.data;
    }

    async register(data: RegisterData): Promise<any> {
        // Obligatorio obtener la cookie CSRF antes de hacer un POST de registro
        await this.initializeCSRF();

        const response = await this.api.post('/api/register', {
            ...data
        });

        return response.data;
    }

    async logout(): Promise<void> {
        await this.api.post('/api/logout');
        // El navegador eliminará/invalidará la cookie automáticamente
        // basándose en la respuesta del backend.
    }

    async checkAuth(): Promise<any> {
        const response = await this.api.get('/api/user');
        return response.data;
    }

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
