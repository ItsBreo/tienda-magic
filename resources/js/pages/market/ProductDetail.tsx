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
            <div className="flex-1 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-950">
                <AlertCircle className="w-16 h-16 text-zinc-300 mb-4" />
                <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-200">Producto no encontrado</h1>
                <Link to="/market" className="mt-4 text-indigo-500 hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver al mercado
                </Link>
            </div>
        );
    }

    return (
        <div className="flex-1 bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                {/* Header / Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-zinc-500 mb-6">
                    <Link to="/market" className="hover:text-indigo-500 transition-colors">Mercado</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-zinc-900 dark:text-zinc-100 font-medium">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Product Info & Chart */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Product Card */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm overflow-hidden relative">
                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Image Container */}
                                <div className="w-full md:w-56 flex-shrink-0 group">
                                    <div className="aspect-[2.5/3.5] bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden shadow-lg transform transition-transform group-hover:scale-[1.02]">
                                        {product.image_url ? (
                                            <img 
                                                src={product.image_url} 
                                                alt={product.name} 
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <ShoppingBag className="w-12 h-12 text-zinc-300" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                                            {product.name}
                                        </h1>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-bold uppercase tracking-wider">
                                                {product.rarity || 'Common'}
                                            </span>
                                            <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-medium">
                                                {product.cardSet?.name} ({product.cardSet?.code?.toUpperCase()})
                                            </span>
                                            {product.type_line && (
                                                <span className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-medium">
                                                    {product.type_line}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 py-4 border-y border-zinc-100 dark:border-zinc-800">
                                        <div className="text-center">
                                            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Desde</p>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                                {listings.length > 0 ? `${Number(listings[0].price_total).toFixed(2)}€` : '--'}
                                            </p>
                                        </div>
                                        <div className="text-center border-x border-zinc-100 dark:border-zinc-800">
                                            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Vendedores</p>
                                            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{listings.length}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-xs text-zinc-500 uppercase font-bold mb-1">Tendencia</p>
                                            <div className="flex items-center justify-center gap-1 text-emerald-500">
                                                <TrendingUp className="w-4 h-4" />
                                                <span className="text-lg font-bold">+2.4%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/30 flex items-start gap-3">
                                        <Info className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-indigo-900/70 dark:text-indigo-300/70 leading-relaxed">
                                            Este es un activo digital. Al comprarlo, se transferirá inmediatamente a tu inventario. No se requiere envío físico.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Price History Chart */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-indigo-500" />
                                    Historial de Precios
                                </h3>
                                <div className="flex gap-1">
                                    {['7D', '30D', '90D', 'All'].map(p => (
                                        <button key={p} className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${p === '30D' ? 'bg-indigo-500 text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500'}`}>
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
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
                                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-indigo-500" />
                                    Top Vendedores Active
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-zinc-500 uppercase bg-zinc-50 dark:bg-zinc-800/50">
                                        <tr>
                                            <th className="px-6 py-4 font-bold">Vendedor</th>
                                            <th className="px-6 py-4 font-bold text-center">Estado</th>
                                            <th className="px-6 py-4 font-bold text-right">Precio</th>
                                            <th className="px-6 py-4 font-bold text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                        {listings.length > 0 ? listings.map((listing) => (
                                            <tr 
                                                key={listing.id} 
                                                className={`group transition-colors ${selectedListing?.id === listing.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/30'}`}
                                                onClick={() => setSelectedListing(listing)}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-500">
                                                            {listing.seller?.username?.slice(0, 2).toUpperCase() || '??'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{listing.seller?.username || 'Desconocido'}</p>
                                                            <div className="flex items-center gap-1 text-[10px] text-zinc-500">
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
                                                    <p className="text-base font-bold text-zinc-900 dark:text-zinc-100">{Number(listing.price_total).toFixed(2)}€</p>
                                                    <p className="text-[10px] text-zinc-500">Envío Gratis</p>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button 
                                                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                                            selectedListing?.id === listing.id 
                                                                ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                                                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200'
                                                        }`}
                                                    >
                                                        {selectedListing?.id === listing.id ? 'Seleccionado' : 'Seleccionar'}
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 italic">
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
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-xl shadow-indigo-500/5">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-indigo-500" />
                                Confirmar Compra
                            </h3>

                            {selectedListing ? (
                                <div className="space-y-6">
                                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-100 dark:border-zinc-800">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-zinc-500">Artículo</span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{product.name}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-zinc-500">Vendedor</span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">{selectedListing.seller?.username || 'Desconocido'}</span>
                                        </div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-zinc-500">Plataforma (Fee)</span>
                                            <span className="font-medium text-zinc-900 dark:text-zinc-100">+{Number(selectedListing.fee_platform).toFixed(2)}€</span>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-between items-end">
                                            <span className="text-sm font-bold text-zinc-500">Precio Total</span>
                                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                                                {Number(selectedListing.price_total).toFixed(2)}€
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Método de Pago</p>
                                        
                                        {/* Wallet Option */}
                                        <button 
                                            onClick={() => setPaymentMethod('wallet')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                                paymentMethod === 'wallet' 
                                                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                                                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'wallet' ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200'}`}>
                                                    <Wallet className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Mi Billetera</p>
                                                    <p className="text-[10px] text-zinc-500">{Number(user?.wallet_balance || 0).toFixed(2)}€ disponible</p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                                        </button>

                                        {/* Stripe Option */}
                                        <button 
                                            onClick={() => setPaymentMethod('stripe')}
                                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                                                paymentMethod === 'stripe' 
                                                    ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10' 
                                                    : 'border-zinc-100 dark:border-zinc-800 hover:border-zinc-200'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg transition-colors ${paymentMethod === 'stripe' ? 'bg-indigo-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-200'}`}>
                                                    <CreditCard className="w-5 h-5" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Tarjeta / Stripe</p>
                                                    <p className="text-[10px] text-zinc-500">Pago seguro global</p>
                                                </div>
                                            </div>
                                            {paymentMethod === 'stripe' && <CheckCircle2 className="w-5 h-5 text-indigo-500" />}
                                        </button>
                                    </div>

                                    <button 
                                        disabled={processing || (paymentMethod === 'wallet' && (user?.wallet_balance || 0) < selectedListing.price_total)}
                                        onClick={handlePurchase}
                                        className="w-full h-14 bg-zinc-900 dark:bg-indigo-600 text-white rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
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
                                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                            <p className="text-[10px] text-amber-700 dark:text-amber-400">
                                                Saldo insuficiente. <Link to="/wallet" className="font-bold underline">Recargar billetera</Link>
                                            </p>
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-500 text-center space-y-2">
                                        <p className="flex items-center justify-center gap-1">
                                            <CheckCircle2 className="w-3 h-3 text-indigo-500" />
                                            Transacción asegurada por CardVault
                                        </p>
                                        <p>Se generará una factura oficial tras completarse el pago.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-12 text-center">
                                    <ShoppingBag className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                                    <p className="text-zinc-500 text-sm">Selecciona un vendedor para continuar</p>
                                </div>
                            )}
                        </div>

                        {/* Recent Activity / Market stats */}
                        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-500" />
                                Detalles del Mercado
                            </h4>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Última venta</span>
                                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">hace 34 min</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Promedio (30d)</span>
                                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">4.82€</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Volumen</span>
                                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">1,204 ventas</span>
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
