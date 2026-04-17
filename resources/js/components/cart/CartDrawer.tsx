import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, X, ArrowRight, Package, Trash2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import CartItem from './CartItem';
import { cn } from '@/lib/utils';

export default function CartDrawer() {
    const { items, loading, isDrawerOpen, setDrawerOpen, totalAmount, updateQuantity, removeItem } = useCart();
    const navigate = useNavigate();
    const drawerRef = useRef<HTMLDivElement>(null);

    const handleCheckout = () => {
        setDrawerOpen(false);
        navigate('/cart'); 
    };

    // Cerrar al hacer click fuera (opcional, pero Amazon lo permite interactuar)
    // Para el estilo Amazon, NO bloqueamos el fondo, así que no necesitamos backdrop.
    
    return (
        <>
            {/* Overlay sutil solo si queremos enfoque, pero el usuario pidió interactuar con la web. 
                Así que NO pondremos overlay real que bloquee puntero. 
                Usaremos una sombra proyectada sobre la web. */}
            
            <div 
                ref={drawerRef}
                className={cn(
                    "fixed top-0 right-0 h-screen w-full sm:w-[400px] bg-card/95 backdrop-blur-2xl border-l border-border z-[100] shadow-[-20px_0_50px_rgba(0,0,0,0.5)] transition-all duration-500 ease-in-out flex flex-col transform",
                    isDrawerOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header Estilizado */}
                <div className="p-8 border-b border-border bg-gradient-to-r from-primary/5 to-transparent shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-primary/10 rounded-xl border border-primary/20">
                                <ShoppingCart className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight">Mi Carrito</h2>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                    {items.length} {items.length === 1 ? 'Artículo' : 'Artículos'}
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setDrawerOpen(false)}
                            className="p-2 hover:bg-accent rounded-full text-muted-foreground hover:text-foreground transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Lista de Items */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center opacity-50">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                            <span className="text-xs font-bold uppercase tracking-widest">Sincronizando...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center px-10">
                            <div className="w-20 h-20 bg-accent/30 rounded-full flex items-center justify-center mb-6">
                                <Package size={40} className="text-muted-foreground/40" />
                            </div>
                            <h3 className="text-lg font-black text-foreground mb-2">Carrito Vacío</h3>
                            <p className="text-xs text-muted-foreground font-medium leading-relaxed mb-8">
                                Parece que aún no has añadido tesoros a tu colección.
                            </p>
                            <Button 
                                variant="outline" 
                                className="border-primary/50 text-primary hover:bg-primary/10 font-black uppercase text-[10px] tracking-widest px-8"
                                onClick={() => setDrawerOpen(false)}
                            >
                                Volver a la Tienda
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {[...items].sort((a, b) => a.id - b.id).map((item) => (
                                <CartItem 
                                    key={item.id} 
                                    item={item} 
                                    onUpdateQuantity={updateQuantity} 
                                    onRemove={removeItem}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer del Carrito */}
                {items.length > 0 && (
                    <div className="p-8 bg-card border-t border-border shrink-0 space-y-6 shadow-[0_-10px_30px_rgba(0,0,0,0.2)]">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                <span>Subtotal</span>
                                <span>{totalAmount.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-black text-foreground uppercase tracking-[0.2em]">Total Final</span>
                                <span className="text-3xl font-black text-primary">
                                    {totalAmount.toFixed(2)}€
                                </span>
                            </div>
                        </div>

                        <div className="pt-2">
                            <Button 
                                className="w-full h-16 bg-primary text-primary-foreground font-black uppercase tracking-[0.2em] text-xs rounded-2xl shadow-2xl shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4"
                                onClick={handleCheckout}
                            >
                                <span className="flex-1 flex items-center justify-center">Finalizar Pedido</span>
                                <div className="h-full items-center flex px-4 -mr-4 rounded-r-2xl">
                                    <ArrowRight size={20} />
                                </div>
                            </Button>
                        </div>
                        
                        {/* Removido: Envío gratis y Ver Carrito redundant button as per request */}
                    </div>
                )}
            </div>
        </>
    );
}

// Helper Loader needed
function Loader2({ className }: { className?: string }) {
    return (
        <svg className={cn("animate-spin", className)} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    );
}
