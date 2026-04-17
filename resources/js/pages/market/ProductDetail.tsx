import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Wallet, 
    CreditCard, 
    Info, 
    ChevronRight, 
    TrendingUp, 
    Users, 
    ShoppingBag, 
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import ApiService from '../../services/ApiService';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { useAuth } from '../../contexts/AuthContext';
import PriceChart from '../../components/market/PriceChart';

interface MarketListing {
    id: number;
    seller: {
        id: number;
        username: string;
    };
    price_total: number;
    amount_to_seller: number;
    fee_platform: number;
    status: string;
}

interface Product {
    id: number;
    name: string;
    image_url?: string;
    rarity?: string;
    type_line?: string;
    cardSet?: {
        name: string;
        code: string;
    };
}

const ProductDetail: React.FC = () => {
    const { type, id } = useParams<{ type: 'card' | 'pack'; id: string }>();
    const { user, refreshUser } = useAuth();
    const navigate = useNavigate();
    const api = ApiService;

    const [product, setProduct] = useState<Product | null>(null);
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
    const [processing, setProcessing] = useState(false);
    const [selectedListing, setSelectedListing] = useState<MarketListing | null>(null);

    useEffect(() => {
        fetchData();
    }, [type, id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await api.getProductDetail(type as any, parseInt(id!));
            setProduct(data.product);
            setListings(data.listings);
            
            // Seleccionar por defecto el más barato si hay anuncios
            if (data.listings.length > 0) {
                setSelectedListing(data.listings[0]);
            }
        } catch (error) {
            console.error('Error fetching product detail:', error);
            toast.error('No se pudo cargar el detalle del producto');
        } finally {
            setLoading(false);
        }
    };

    const handlePurchase = async () => {
        if (!selectedListing) return;
        
        if (selectedListing.seller.id === user?.id) {
            toast.error('No puedes comprar tu propio artículo');
            return;
        }

        setProcessing(true);
        try {
            const res = await api.initiateMarketPurchase(selectedListing.id, paymentMethod);
            if (res.checkout_url) {
                window.location.href = res.checkout_url;
            } else if (res.success) {
                toast.success('¡Compra realizada con éxito!');
                refreshUser();
                setTimeout(() => {
                    navigate('/inventory');
                }, 1500);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error al procesar la compra');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-background">
                <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold text-foreground">Producto no encontrado</h1>
                <Link to="/market" className="mt-4 text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver al mercado
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-background p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header / Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link to="/market" className="hover:text-primary transition-colors">Mercado</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Product Info & Chart */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Product Card */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm overflow-hidden relative">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Image Container */}
                                <div className="w-full md:w-56 flex-shrink-0 group">
                                    <div className="aspect-[2.5/3.5] bg-accent rounded-xl overflow-hidden shadow-lg transform transition-transform group-hover:scale-[1.02]">
                                        {product.image_url ? (
                                            <img 
                                                src={product.image_url} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                                            {product.name}
                                        </h1>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
                                                {product.rarity || 'Common'}
                                            </span>
                                            <span className="px-3 py-1 bg-accent text-muted-foreground rounded-full text-xs font-medium">
                                                {product.cardSet?.name} ({product.cardSet?.code?.toUpperCase()})
                                            </span>
                                            {product.type_line && (
                                                <span className="px-3 py-1 bg-accent text-muted-foreground rounded-full text-xs font-medium">
                                                    {product.type_line}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Desde</p>
                                            <p className="text-lg font-bold text-foreground">
                                                {listings.length > 0 ? `${Number(listings[0].price_total).toFixed(2)}€` : '--'}
                                            </p>
                                        </div>
                                        <div className="text-center border-x border-border">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Vendedores</p>
                                            <p className="text-lg font-bold text-foreground">{listings.length}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Tendencia</p>
                                            <div className="flex items-center justify-center gap-1 text-emerald-500">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-lg font-bold">+2.4%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-foreground/80 leading-relaxed">
                                            Este es un activo digital. Al comprarlo, se transferirá inmediatamente a tu inventario. No se requiere envío físico.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Price History Chart */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                    Historial de Precios
                                </h3>
                                <div className="flex gap-1">
                                    {['7D', '30D', '90D', 'All'].map(p => (
                                        <button key={p} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${p === '30D' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent text-muted-foreground'}`}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="h-64">
                                <ErrorBoundary>
                                    <PriceChart type={type as any} id={parseInt(id!)} />
                                </ErrorBoundary>
                            </div>
                        </div>

                        {/* Sellers Table */}
                        <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-border">
                                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                    <Users className="w-5 h-5 text-primary" />
                                    Top Vendedores Active
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted-foreground uppercase bg-accent/50">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Vendedor</th>
                                            <th className="px-6 py-4 font-bold text-center">Estado</th>
                                            <th className="px-6 py-4 font-bold text-right">Precio</th>
                                            <th className="px-6 py-4 font-bold text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {listings.length > 0 ? listings.map((listing) => (
                                            <tr 
                                                key={listing.id} 
                                                className={`group transition-colors ${selectedListing?.id === listing.id ? 'bg-primary/10' : 'hover:bg-accent/50'}`}
                                                onClick={() => setSelectedListing(listing)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-muted-foreground">
                                                            {listing.seller?.username?.slice(0, 2).toUpperCase() || '??'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-foreground">{listing.seller?.username || 'Desconocido'}</p>
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <span className="text-emerald-500 font-bold">100% Positivo</span>
                                                                <span>•</span>
                                                                <span>42 ventas</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                                        <CheckCircle2 className="w-3 h-3" /> Digital-NM
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {listing.seller?.id === user?.id ? (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">TUYO</span>
                                                    ) : (
                                                        <p className="text-base font-bold text-foreground">{Number(listing.price_total).toFixed(2)}€</p>
                                                    )}
                                                    <p className="text-[10px] text-muted-foreground">Envío Gratis</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            selectedListing?.id === listing.id 
                                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20' 
                                                                : 'bg-accent text-muted-foreground hover:bg-zinc-200 dark:hover:bg-zinc-700'
                                                        }`}
                                                    >
                                                        {selectedListing?.id === listing.id ? 'Seleccionado' : 'Seleccionar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">
                                                    No hay vendedores activos para este artículo actualmente.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Checkout Sidebar */}
                    <div className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6">
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl shadow-primary/5">
                            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Confirmar Compra
                            </h3>

                            {selectedListing ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-accent/50 rounded-xl border border-border">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Artículo</span>
                                            <span className="font-medium text-foreground">{product.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Vendedor</span>
                                            <span className="font-medium text-foreground">{selectedListing.seller?.username || 'Desconocido'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">Plataforma (Fee)</span>
                                            <span className="font-medium text-foreground">+{Number(selectedListing.fee_platform).toFixed(2)}€</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                                            <span className="text-sm font-bold text-muted-foreground">Precio Total</span>
                                            <span className="text-3xl font-black text-primary tabular-nums">
                                                {Number(selectedListing.price_total).toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Método de Pago</p>
                                        
                                        {/* Wallet Option */}
                                        <button 
                                            onClick={() => setPaymentMethod('wallet')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                                paymentMethod === 'wallet' 
                                                    ? 'border-primary bg-primary/10' 
                                                    : 'border-border hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'wallet' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-foreground">Mi Billetera</p>
                                                    <p className="text-[10px] text-muted-foreground">{Number(user?.wallet_balance || 0).toFixed(2)}€ disponible</p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </button>

                                        {/* Stripe Option */}
                                        <button 
                                            onClick={() => setPaymentMethod('stripe')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                                paymentMethod === 'stripe' 
                                                    ? 'border-primary bg-primary/10' 
                                                    : 'border-border hover:border-zinc-300 dark:hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'stripe' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                                    <CreditCard className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-foreground">Tarjeta / Stripe</p>
                                                    <p className="text-[10px] text-muted-foreground">Pago seguro global</p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'stripe' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                                        </button>
                                    </div>

                                    <button 
                                        disabled={processing || (paymentMethod === 'wallet' && (user?.wallet_balance || 0) < selectedListing.price_total) || selectedListing.seller?.id === user?.id}
                                        onClick={handlePurchase}
                                        className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                                    >
                                        {processing ? (
                                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {paymentMethod === 'wallet' ? 'Pagar con Billetera' : 'Continuar a Stripe'}
                                            </>
                                        )}
                                    </button>

                                    {paymentMethod === 'wallet' && (user?.wallet_balance || 0) < selectedListing.price_total && (
                                        <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-destructive">
                                                Saldo insuficiente. <Link to="/wallet" className="font-bold underline">Recargar billetera</Link>
                                            </p>
                                        </div>
                                    )}

                                    {selectedListing.seller?.id === user?.id && (
                                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-500 font-bold">
                                                Este es tu propio artículo. Puedes gestionarlo desde Marketplace &gt; Mis Anuncios.
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-border text-[10px] text-muted-foreground text-center space-y-2">
                                        <p className="flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-primary" />
                                            Transacción asegurada por CardVault
                                        </p>
                                        <p>Se generará una factura oficial tras completarse el pago.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                    <p className="text-muted-foreground text-sm">Selecciona un vendedor para continuar</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity / Market stats */}
                        <div className="bg-card rounded-2xl border border-border p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-primary" />
                                Detalles del Mercado
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Última venta</span>
                                    <span className="text-foreground font-bold">hace 34 min</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Promedio (30d)</span>
                                    <span className="text-foreground font-bold">4.82€</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted-foreground">Volumen</span>
                                    <span className="text-foreground font-bold">1,204 ventas</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
