import React from 'react';

interface CartSummaryProps {
    itemCount: number;
    total: string;
    onCheckout: () => void;
}

export default function CartSummary({ itemCount, total, onCheckout }: CartSummaryProps) {
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

            <button
                onClick={onCheckout}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.15)] active:scale-95 flex justify-center items-center gap-2"
            >
                Proceder al Pago
            </button>
        </div>
    );
}
