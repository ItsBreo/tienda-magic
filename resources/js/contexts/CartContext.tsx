import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiService from '@/services/ApiService';
import { toast } from 'sonner';

interface CartItem {
    id: number;
    booster_pack_id: number | null;
    card_id: number | null;
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    image_url?: string;
    stock?: number;
    booster_pack?: any;
    card?: any;
}

interface CartContextType {
    items: CartItem[];
    loading: boolean;
    isDrawerOpen: boolean;
    setDrawerOpen: (open: boolean) => void;
    fetchCart: (showLoader?: boolean) => Promise<void>;
    addToCart: (item: { type: 'card' | 'pack', id: number, quantity: number }) => Promise<void>;
    updateQuantity: (itemId: number, newQuantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    totalAmount: number;
    itemCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDrawerOpen, setDrawerOpen] = useState(false);

    const fetchCart = useCallback(async (showLoader = true) => {
        try {
            if (showLoader) setLoading(true);
            const response = await apiService.axiosInstance.get('/api/cart');
            const cartData = response.data?.data?.items || response.data?.items || response.data || [];
            setItems(Array.isArray(cartData) ? cartData : []);
        } catch (error: any) {
            if (error?.response?.status === 401 || error?.status === 401) {
                // Silently handle unauthenticated state (guests don't have carts)
                setItems([]);
                return;
            }
            console.error('Error fetching cart:', error);
            // Non-blocking toast if it's just a background sync
            if (showLoader) toast.error('Error al sincronizar el carrito');
        } finally {
            if (showLoader) setLoading(false);
        }
    }, []);

    const addToCart = async ({ type, id, quantity }: { type: 'card' | 'pack', id: number, quantity: number }) => {
        try {
            const data = {
                [type === 'card' ? 'card_id' : 'booster_pack_id']: id,
                quantity
            };
            await apiService.axiosInstance.post('/api/cart', data);
            await fetchCart(false);
            setDrawerOpen(true);
            toast.success('Producto añadido al carrito');
        } catch (error: any) {
            console.error('Error adding to cart:', error);
            const message = error.response?.data?.message || 'No se pudo añadir al carrito';
            toast.error(message);
        }
    };

    const updateQuantity = async (itemId: number, newQuantity: number) => {
        try {
            // Optimistic update could go here
            await apiService.axiosInstance.put(`/api/cart/${itemId}`, { quantity: newQuantity });
            await fetchCart(false);
        } catch (error: any) {
            console.error('Error updating quantity:', error);
            const message = error.response?.data?.message || 'Error al actualizar cantidad';
            toast.error(message);
            await fetchCart(false); // Rollback
        }
    };

    const removeItem = async (itemId: number) => {
        try {
            await apiService.axiosInstance.delete(`/api/cart/${itemId}`);
            setItems(prev => prev.filter(item => item.id !== itemId));
            toast.success('Producto eliminado');
        } catch (error) {
            console.error('Error removing item:', error);
            toast.error('No se pudo eliminar el item');
        }
    };

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const totalAmount = items.reduce((sum, item) => sum + item.total_price, 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            items,
            loading,
            isDrawerOpen,
            setDrawerOpen,
            fetchCart,
            addToCart,
            updateQuantity,
            removeItem,
            totalAmount,
            itemCount
        }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
