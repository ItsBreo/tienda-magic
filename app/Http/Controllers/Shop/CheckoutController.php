<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
            return response()->json(['message' => 'Tu carrito está vacío.'], 400);
        }

        // Calcular totales
        $subtotal = $cart->items->sum(function ($item) {
            return $item->booster_pack->price * $item->quantity;
        });

        $tax = $subtotal * 0.21; // 21% IVA
        $total = $subtotal + $tax;

        return response()->json([
            'data' => [
                'cart' => $cart,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'total' => $total,
                'stripe_key' => config('services.stripe.public_key'),
            ]
        ]);
    }

    public function process(Request $request)
    {
        try {
            $user = Auth::user();

            // Validar y sanitizar el monto total
            $validated = $request->validate([
                'total' => 'required|numeric|min:0.01|max:1000',
            ]);

            $total = (float) $validated['total'];

            // Validar que el usuario tiene fondos suficientes
            if ($user->wallet_balance < $total) {
                return response()->json(['message' => 'Fondos insuficientes.'], 400);
            }

            // Obtener carrito
            $cart = Cart::with('items.boosterPack')
                        ->where('user_id', $user->id)
                        ->first();

            if (!$cart) {
                return response()->json(['message' => 'Carrito no encontrado.'], 404);
            }

            // DB transaction para si algo falla, no cobramos nada y hacemos rollback
            DB::transaction(function () use ($user, $total, $cart) {
                // Restamos el dinero del wallet
                $user->wallet_balance -= $total;
                $user->save();

                // Creamos la orden
                $order = \App\Models\Order::create([
                    'user_id' => $user->id,
                    'total_price' => $total,
                    'status' => 'completed',
                ]);

                // Añadimos los items a la orden
                foreach ($cart->items as $cartItem) {
                    \App\Models\OrderItem::create([
                        'order_id' => $order->id,
                        'booster_pack_id' => $cartItem->booster_pack_id,
                        'quantity' => $cartItem->quantity,
                        'price_at_purchase' => $cartItem->boosterPack->price,
                    ]);
                }

                // Vaciamos el carrito
                $cart->items()->delete();
            });

            // Todo bien, devolvemos mensaje de exito
            return response()->json(['message' => '¡Pago completado con éxito!'], 200);

        } catch (\Exception $e) {
            // Log para debuggear
            \Log::error('Error en proceso de checkout: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);

            // Devolvemos un error genérico al front para no filtrar datos de la BD
            return response()->json([
                'message' => 'Error al procesar el pago. Se ha cancelado la operación.'
            ], 500);
        }
    }
}
