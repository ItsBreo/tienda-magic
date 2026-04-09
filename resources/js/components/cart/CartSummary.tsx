import React from 'react';
import { Loader2, CreditCard, Wallet, AlertCircle } from 'lucide-react';

interface CartSummaryProps {
    itemCount: number;
    total: string;
    selectedPaymentMethod: 'wallet' | 'stripe';
    onPaymentMethodChange: (method: 'wallet' | 'stripe') => void;
    onCheckout: (method: 'wallet' | 'stripe') => void;
    isCheckingOut?: boolean;
    walletBalance: number;
    isWalletInsufficient: boolean;
    hasStockIssues?: boolean;
}

export default function CartSummary({
    itemCount,
    total,
    selectedPaymentMethod,
    onPaymentMethodChange,
    onCheckout,
    isCheckingOut = false,
    walletBalance,
    isWalletInsufficient,
    hasStockIssues = false,
}: CartSummaryProps) {
    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 sticky top-24">
            <h2 className="text-xl font-bold mb-6 pb-4 border-b border-zinc-800">Resumen del Pedido</h2>

            <div className="space-y-3 mb-6">
                <div className="flex justify-between text-zinc-400">
                    <span>Subtotal ({itemCount} items)</span>
                    <span>{total}€</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                    <span>Impuestos</span>
                    <span>Calculados en el checkout</span>
                </div>
            </div>

            <div className="flex justify-between items-end mb-8 pt-4 border-t border-zinc-800">
                <span className="text-lg font-medium">Total Estimado</span>
                <span className="text-3xl font-bold text-emerald-400">{total}€</span>
            </div>

            {/* Selector de Método de Pago */}
            <div className="mb-6">
                <h3 className="text-sm font-medium text-zinc-300 mb-3">Método de Pago</h3>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => onPaymentMethodChange('wallet')}
                        disabled={isWalletInsufficient}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                            selectedPaymentMethod === 'wallet'
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : isWalletInsufficient
                                ? 'border-zinc-700 bg-zinc-800/50 text-zinc-600 cursor-not-allowed'
                                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                        }`}
                    >
                        <Wallet className="w-5 h-5" />
                        <span className="text-sm font-medium">Mi Billetera</span>
                        <span className="text-xs text-zinc-400">
                            {Number(walletBalance).toFixed(2)}€ disponible
                        </span>
                    </button>

                    <button
                        onClick={() => onPaymentMethodChange('stripe')}
                        className={`p-3 rounded-lg border transition-all flex flex-col items-center gap-2 ${
                            selectedPaymentMethod === 'stripe'
                                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                                : 'border-zinc-700 bg-zinc-800/50 text-zinc-300 hover:border-zinc-600'
                        }`}
                    >
                        <CreditCard className="w-5 h-5" />
                        <span className="text-sm font-medium">Tarjeta</span>
                        <span className="text-xs text-zinc-400">Stripe seguro</span>
                    </button>
                </div>

                {/* Alerta de saldo insuficiente */}
                {isWalletInsufficient && selectedPaymentMethod === 'wallet' && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400">
                            Saldo insuficiente. Necesitas {(parseFloat(total) - Number(walletBalance)).toFixed(2)}€ más.
                        </span>
                    </div>
                )}

                {/* Alerta de problemas de stock */}
                {hasStockIssues && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-400">
                            Hay problemas de stock en tu carrito. Por favor, ajusta las cantidades.
                        </span>
                    </div>
                )}
            </div>

            {/* Botón de Pago */}
            <button
                onClick={() => onCheckout(selectedPaymentMethod)}
                disabled={isCheckingOut || (selectedPaymentMethod === 'wallet' && isWalletInsufficient) || hasStockIssues}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.15)] active:scale-95 flex justify-center items-center gap-2"
            >
                {isCheckingOut ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {selectedPaymentMethod === 'wallet' ? 'Procesando pago...' : 'Redirigiendo a Stripe...'}
                    </>
                ) : (
                    selectedPaymentMethod === 'wallet'
                        ? `Pagar ${total}€ con Billetera`
                        : `Pagar ${total}€ con Tarjeta`
                )}
            </button>
        </div>
    );
}
