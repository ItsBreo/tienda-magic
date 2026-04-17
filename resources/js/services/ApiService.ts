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
            },
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
                    const publicPaths = ['/login', '/register'];
                    if (!publicPaths.includes(window.location.pathname)) {
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
        const { token } = response.data;

        if (token) {
            this.setToken(token);
        }

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

    async getLatestSets(): Promise<any> {
        const response = await this.api.get('/api/sets/latest');
        return response.data;
    }

    async processCheckout(billingData: any): Promise<any> {
        const response = await this.api.post('/api/checkout/process', billingData);
        return response.data;
    }

    async rechargeWallet(amount: number): Promise<any> {
        const response = await this.api.post('/api/wallet/recharge', { amount });
        return response.data;
    }

    async getWalletTransactions(page: number = 1): Promise<any> {
        const response = await this.api.get('/api/wallet/transactions', { params: { page } });
        return response.data;
    }

    async downloadWalletTransactionsPdf(): Promise<Blob> {
        const response = await this.api.get('/api/wallet/transactions/pdf', {
            responseType: 'blob'
        });
        return new Blob([response.data], { type: 'application/pdf' });
    }

    // ─── Red Social y Foro ───────────────────────────────────────────────────

    async getForums(): Promise<any> {
        const response = await this.api.get('/api/forums');
        return response.data;
    }

    async getForumThreads(forumSlug: string, sort: string = 'hot', page: number = 1, perPage: number = 20): Promise<any> {
        const response = await this.api.get(`/api/forums/${forumSlug}`, { params: { sort, page, per_page: perPage } });
        console.log(`[ApiService] getForumThreads (${forumSlug}) recibidos:`, response.data);
        return response.data;
    }

    async getThreads(sort: string = 'hot', page: number = 1, perPage: number = 20): Promise<any> {
        const response = await this.api.get('/api/threads', { params: { sort, page, per_page: perPage } });
        console.log('[ApiService] getThreads recibidos:', response.data);
        return response.data;
    }

    async getThread(threadId: number): Promise<any> {
        const response = await this.api.get(`/api/threads/${threadId}`);
        return response.data;
    }

    async createThread(data: any): Promise<any> {
        const response = await this.api.post('/api/threads', data);
        return response.data;
    }

    async createComment(threadId: number, data: { body: string, parent_id?: number }): Promise<any> {
        const response = await this.api.post(`/api/threads/${threadId}/comments`, data);
        return response.data;
    }

    async saveThread(threadId: number): Promise<any> {
        const response = await this.api.post(`/api/saved/${threadId}`);
        return response.data;
    }

    async unsaveThread(threadId: number): Promise<any> {
        const response = await this.api.delete(`/api/saved/${threadId}`);
        return response.data;
    }

    async getSavedThreads(page: number = 1, perPage: number = 20): Promise<any> {
        const response = await this.api.get('/api/saved', { params: { page, per_page: perPage } });
        return response.data;
    }

    async vote(votableId: number, votableType: 'thread' | 'comment', value: number): Promise<any> {
        const response = await this.api.post('/api/votes', {
            votable_id: votableId,
            votable_type: votableType,
            value: value
        });
        return response.data;
    }

    async updateThread(threadId: number, data: { title: string, body: string }): Promise<any> {
        const response = await this.api.put(`/api/threads/${threadId}`, data);
        return response.data;
    }

    async deleteThread(threadId: number): Promise<any> {
        const response = await this.api.delete(`/api/threads/${threadId}`);
        return response.data;
    }

    async deleteComment(commentId: number): Promise<any> {
        const response = await this.api.delete(`/api/comments/${commentId}`);
        return response.data;
    }

    async getProfile(userId: number): Promise<any> {
        const response = await this.api.get(`/api/profile/${userId}`);
        return response.data;
    }

    async getTournaments(): Promise<any> {
        const response = await this.api.get('/api/tournaments');
        return response.data;
    }

    async createTournament(data: {
        name: string;
        description?: string;
        starts_at: string;
        location: string;
        format: string;
        max_players: number;
        entry_fee?: number;
        prize?: string;
    }): Promise<any> {
        const response = await this.api.post('/api/tournaments', data);
        return response.data;
    }

    async registerTournament(id: number): Promise<any> {
        const response = await this.api.post(`/api/tournaments/${id}/register`);
        return response.data;
    }

    async unregisterTournament(id: number): Promise<any> {
        const response = await this.api.delete(`/api/tournaments/${id}/register`);
        return response.data;
    }

    async getTournamentDetail(id: number): Promise<any> {
        const response = await this.api.get(`/api/tournaments/${id}`);
        return response.data;
    }

    // ─── Intercambios (Exchanges) ─────────────────────────────────────────────

    async getExchanges(): Promise<any> {
        const response = await this.api.get('/api/exchanges');
        return response.data;
    }

    async createExchange(data: { offered_inventory_card_id: number; requested_card_id?: number | null }): Promise<any> {
        const response = await this.api.post('/api/exchanges', data);
        return response.data;
    }

    async requestExchange(exchangeId: number, data: { offered_inventory_card_id: number }): Promise<any> {
        const response = await this.api.post(`/api/exchanges/${exchangeId}/request`, data);
        return response.data;
    }

    async getMyRequests(): Promise<any> {
        const response = await this.api.get('/api/exchange-requests');
        return response.data;
    }

    async acceptTradeRequest(requestId: number): Promise<any> {
        const response = await this.api.post(`/api/exchange-requests/${requestId}/accept`);
        return response.data;
    }

    async rejectTradeRequest(requestId: number): Promise<any> {
        const response = await this.api.post(`/api/exchange-requests/${requestId}/reject`);
        return response.data;
    }

    async getTradeRoom(roomId: number): Promise<any> {
        const response = await this.api.get(`/api/trade-sessions/${roomId}`);
        return response.data;
    }

    async confirmTrade(roomId: number): Promise<any> {
        const response = await this.api.post(`/api/trade-sessions/${roomId}/confirm`);
        return response.data;
    }

    async cancelTrade(roomId: number): Promise<any> {
        const response = await this.api.post(`/api/trade-sessions/${roomId}/cancel`);
        return response.data;
    }

    async changeTradeCard(roomId: number, newInventoryCardId: number): Promise<any> {
        const response = await this.api.post(`/api/trade-sessions/${roomId}/change-card`, {
            new_inventory_card_id: newInventoryCardId
        });
        return response.data;
    }

    async getTradeMessages(roomId: number): Promise<any> {
        const response = await this.api.get(`/api/trade-sessions/${roomId}/messages`);
        return response.data;
    }

    async sendTradeMessage(roomId: number, content: string): Promise<any> {
        const response = await this.api.post(`/api/trade-sessions/${roomId}/messages`, { content });
        return response.data;
    }

    async getMyInventory(): Promise<any> {
        const response = await this.api.get('/api/inventory');
        return response.data;
    }

    async getAllCards(page: number = 1, search: string = ''): Promise<any> {
        const response = await this.api.get('/api/cards', {
            params: { page, search }
        });
        return response.data;
    }

    // ─── Mercado Secundario (P2P) ─────────────────────────────────────────────

    async getMarketListings(params: { type?: 'card' | 'pack', set?: string, page?: number }): Promise<any> {
        const response = await this.api.get('/api/market', { params });
        return response.data;
    }

    async listOnMarket(data: { inventory_item_id: number, type: 'card' | 'pack', amount_to_seller: number }): Promise<any> {
        const response = await this.api.post('/api/market/cards', data);
        return response.data;
    }

    async buyFromMarket(listingId: number): Promise<any> {
        const response = await this.api.post(`/api/market/cards/${listingId}/buy`);
        return response.data;
    }

    async initiateMarketPurchase(listingId: number, paymentMethod: 'wallet' | 'stripe'): Promise<any> {
        const response = await this.api.post(`/api/market/cards/${listingId}/initiate-purchase`, {
            payment_method: paymentMethod
        });
        return response.data;
    }

    async getProductDetail(type: 'card' | 'pack', id: number): Promise<any> {
        const response = await this.api.get(`/api/market/product/${type}/${id}`);
        return response.data;
    }

    async getPriceHistory(type: 'card' | 'pack', id: number): Promise<any> {
        const response = await this.api.get(`/api/market/price-history/${type}/${id}`);
        return response.data;
    }

    async getMyMarketListings(): Promise<any> {
        const response = await this.api.get('/api/market/my-listings');
        return response.data;
    }

    async cancelMarketListing(listingId: number): Promise<any> {
        const response = await this.api.post(`/api/market/cards/${listingId}/cancel`);
        return response.data;
    }

    async getMarketTransactions(): Promise<any> {
        const response = await this.api.get('/api/market/transactions/my');
        return response.data;
    }

    // ─── Dashboard y Estadísticas ───────────────────────────────────────────

    async getDashboardStats(): Promise<any> {
        const response = await this.api.get('/api/admin/stats');
        return response.data;
    }

    async getAdminPermissions(): Promise<any> {
        const response = await this.api.get('/api/admin/permissions');
        return response.data;
    }

    async updateAdminRole(id: number, data: any): Promise<any> {
        const response = await this.api.put(`/api/admin/roles/${id}`, data);
        return response.data;
    }

    async updateAdminSet(code: string, data: any): Promise<any> {
        const response = await this.api.put(`/api/admin/sets/${code}`, data);
        return response.data;
    }

    async updateAdminCard(id: number, data: any): Promise<any> {
        const response = await this.api.put(`/api/admin/cards/${id}`, data);
        return response.data;
    }

    async getAdminBoosterPacks(): Promise<any> {
        const response = await this.api.get('/api/admin/booster-packs');
        return response.data;
    }

    async createBoosterPack(data: any): Promise<any> {
        const response = await this.api.post('/api/admin/booster-packs', data);
        return response.data;
    }

    async updateBoosterPack(id: number, data: any): Promise<any> {
        const response = await this.api.put(`/api/admin/booster-packs/${id}`, data);
        return response.data;
    }

    async deleteBoosterPack(id: number): Promise<any> {
        const response = await this.api.delete(`/api/admin/booster-packs/${id}`);
        return response.data;
    }


    get axiosInstance(): AxiosInstance {
        return this.api;
    }

}

export const apiService = new MagicApi();
export default apiService;
