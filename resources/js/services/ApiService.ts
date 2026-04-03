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
            // Configuración segura: variable de entorno con fallback
            baseURL: import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            },
            withCredentials: true, // Necesario para Sanctum CSRF cookies
        });

        // Interceptor de REQUEST: inyecta JWT automáticamente
        this.api.interceptors.request.use((config) => {
            const token = this.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Interceptor de RESPONSE: manejo seguro de 401
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
        await this.api.get('/sanctum/csrf-cookie');
        const response = await this.api.post('/api/login', credentials);
        const { token } = response.data;

        if (token) {
            this.setToken(token);
        }

        return response.data;
    }

    async register(data: RegisterData): Promise<any> {
        await this.api.get('/sanctum/csrf-cookie');
        const response = await this.api.post('/api/register', data);
        const { token } = response.data;
        if (token) this.setToken(token);
        return response.data;
    }

    async logout(): Promise<void> {
        try {
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

    async getPacks(page: number = 1, sort: string = '', set: string = '', search: string = ''): Promise<any> {
        const response = await this.api.get('/api/shop', {
            params: {
                page,
                sort,
                set,
                search,
                category: 'packs'
            }
        });
        return response.data;
    }

    async getShopCards(page: number = 1, sort: string = '', set: string = '', search: string = ''): Promise<any> {
        const response = await this.api.get('/api/shop', {
            params: {
                page,
                sort,
                category: 'cards',
                set,
                search,
            },
        });
        return response.data;
    }

    async getCart(): Promise<any> {
        const response = await this.api.get('/api/cart');
        return response.data;
    }

    async addToCart(data: { booster_pack_id?: number, card_id?: number, quantity: number }): Promise<any> {
        // Validar cantidad antes de enviar
        if (data.quantity < 1) {
            throw new Error('La cantidad mínima es 1');
        }

        const response = await this.api.post('/api/cart', data);
        return response.data;
    }

    async updateCartItemQuantity(itemId: number, quantity: number, availableStock?: number): Promise<any> {
        // Validación estricta antes de la llamada API
        if (quantity < 1) {
            throw new Error('La cantidad mínima es 1');
        }

        if (availableStock && quantity > availableStock) {
            throw new Error(`Solo hay ${availableStock} unidades disponibles`);
        }

        const response = await this.api.put(`/api/cart/${itemId}`, { quantity });
        return response.data;
    }

    async removeCartItem(itemId: number): Promise<any> {
        const response = await this.api.delete(`/api/cart/${itemId}`);
        return response.data;
    }

    async getCardsBySet(setCode: string): Promise<any[]> {
        const response = await this.api.get(`/api/cards/set/${setCode}`);
        return response.data;
    }

    async processCheckout(): Promise<any> {
        const response = await this.api.post('/api/checkout/process');
        return response.data;
    }

    async rechargeWallet(amount: number): Promise<any> {
        const response = await this.api.post('/api/wallet/recharge', { amount });
        return response.data;
    }

    get axiosInstance(): AxiosInstance {
        return this.api;
    }
}

export const apiService = new MagicApi();
export default apiService;
