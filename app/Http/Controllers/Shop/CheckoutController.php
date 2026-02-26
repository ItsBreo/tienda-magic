<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Cart;
use App\Models\CartItem;

class CheckoutController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Obtener carrito con items y detalles
        $cart = Cart::with('items.boosterPack.cardSet')
                    ->where('user_id', $user->id)
                    ->first();

        if (!$cart || $cart->items->isEmpty()) {
            return redirect()->route('cart.index')
                ->with('error', 'Tu carrito está vacío.');
        }

        // Calcular totales
        $subtotal = $cart->items->sum(function ($item) {
            return $item->booster_pack->price * $item->quantity;
        });

        $tax = $subtotal * 0.21; // 21% IVA
        $total = $subtotal + $tax;

        return Inertia::render('Shop/Checkout', [
            'cart' => $cart,
            'subtotal' => $subtotal,
            'tax' => $tax,
            'total' => $total,
            'stripe_key' => config('services.stripe.public_key'),
        ]);
    }

    public function process(Request $request)
    {
        $user = Auth::user();

        // Validar y sanitizar el monto total
        $validated = $request->validate([
            'total' => 'required|numeric|min:0.01|max:1000',
        ]);

        $total = (float) $validated['total'];

        // Validar que el usuario tiene fondos suficientes
        if ($user->wallet_balance < $total) {
            return back()->with('error', 'Fondos insuficientes.');
        }

        // Obtener carrito
        $cart = Cart::with('items.boosterPack')
                    ->where('user_id', $user->id)
                    ->first();

        if (!$cart) {
            return back()->with('error', 'Carrito no encontrado.');
        }

        // Simular procesamiento de pago (en producción esto sería con Stripe)
        // Por ahora, lo hacemos como si el pago siempre fuera exitoso

        // Restar fondos del usuario
        $user->wallet_balance -= $total;
        $user->save();

        // Crear orden
        $order = \App\Models\Order::create([
            'user_id' => $user->id,
            'total_amount' => $total,
            'status' => 'completed',
            'payment_method' => 'wallet',
        ]);

        // Añadir items a la orden
        foreach ($cart->items as $cartItem) {
            \App\Models\OrderItem::create([
                'order_id' => $order->id,
                'booster_pack_id' => $cartItem->booster_pack_id,
                'quantity' => $cartItem->quantity,
                'price' => $cartItem->booster_pack->price,
            ]);
        }

        // Vaciar carrito
        $cart->items()->delete();

        // Redirigir a página de apertura de packs con los packs comprados
        return redirect()->route('pack.opening', ['orderId' => $order->id])
            ->with('success', '¡Pago completado! Abre tus packs.');
    }
}
