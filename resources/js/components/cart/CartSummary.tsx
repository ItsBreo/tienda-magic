import React from 'react';
import {
 Loader2, CreditCard, Wallet, AlertCircle, ShoppingBag, CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
        <div className="bg-card rounded-2xl border border-border p-6 shadow-xl shadow-primary/5 sticky top-24">
            <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Confirmar Compra
            </h3>

            <div className="space-y-6">
                <div className="p-4 bg-accent/50 rounded-xl border border-border">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Artículos</span>
                        <span className="font-medium text-foreground">
{itemCount}
{' '}
items
</span>
                    </div>
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Impuestos</span>
                        <span className="font-medium text-foreground">Calculados al final</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-border flex justify-between items-end">
                        <span className="text-sm font-bold text-muted-foreground">Precio Total</span>
                        <span className="text-3xl font-black text-primary tabular-nums">
                            {Number(total).toFixed(2)}
€
</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Método de Pago</p>

                    {/* Wallet Option */}
                    <button
                        disabled={isWalletInsufficient}
                        onClick={() => onPaymentMethodChange('wallet')}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                            selectedPaymentMethod === 'wallet'
                                ? 'border-primary bg-primary/10'
                                : isWalletInsufficient
                                    ? 'border-border bg-accent/50 opacity-50 cursor-not-allowed'
                                    : 'border-border hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${selectedPaymentMethod === 'wallet' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                <Wallet className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">Mi Billetera</p>
                                <p className="text-[10px] text-muted-foreground">
{Number(walletBalance).toFixed(2)}
€ disponible
</p>
                            </div>
                        </div>
                        {selectedPaymentMethod === 'wallet' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </button>

                    {/* Stripe Option */}
                    <button
                        onClick={() => onPaymentMethodChange('stripe')}
                        className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between group ${
                            selectedPaymentMethod === 'stripe'
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg transition-colors ${selectedPaymentMethod === 'stripe' ? 'bg-primary text-primary-foreground' : 'bg-accent text-muted-foreground group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700'}`}>
                                <CreditCard className="w-5 h-5" />
                            </div>
                            <div className="text-left">
                                <p className="text-sm font-bold text-foreground">Tarjeta / Stripe</p>
                                <p className="text-[10px] text-muted-foreground">Pago seguro global</p>
                            </div>
                        </div>
                        {selectedPaymentMethod === 'stripe' && <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </button>
                </div>

                <button
                    disabled={isCheckingOut || (selectedPaymentMethod === 'wallet' && isWalletInsufficient) || hasStockIssues}
                    onClick={() => onCheckout(selectedPaymentMethod)}
                    className="w-full h-14 bg-primary text-primary-foreground rounded-xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
                >
                    {isCheckingOut ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            {selectedPaymentMethod === 'wallet' ? 'Pagar con Billetera' : 'Continuar a Stripe'}
                        </>
                    )}
                </button>

                {isWalletInsufficient && selectedPaymentMethod === 'wallet' && (
                    <div className="p-3 bg-destructive/10 rounded-xl border border-destructive/30 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-destructive">
                            Saldo insuficiente. Necesitas
{' '}
{(parseFloat(total) - Number(walletBalance)).toFixed(2)}
€ más.
{' '}
<Link to="/wallet" className="font-bold underline">Recargar billetera</Link>
                        </p>
                    </div>
                )}

                {hasStockIssues && (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-500 font-bold">
                            Hay problemas de stock en tu carrito. Por favor, ajusta las cantidades antes de continuar.
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
        </div>
    );
}
