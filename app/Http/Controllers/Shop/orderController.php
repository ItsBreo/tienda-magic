<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\Order;
use App\Models\orderItem;
use App\Models\walletTransaction;

class orderController extends Controller
{
    public function store(Request $request)
    {
        $user = Auth::user();

        // Obtenemos carrito con productos
        $cart = Cart::with('items.boosterPack')->where('user_id', $user->id)->first();

        if (!$cart || $cart->items->isEmpty()) {
            return back()->withErrors(['error' => 'El carrito está vacío']);
        }

        // Calculamos el total
        $total = $cart->items->sum(function ($item) {
            return $item->quantity * $item->boosterPack->price;
        });

        // Transacción Atómica (se tiene que completar todo, o fallará y no se harán cambios)
        try {
            DB::transaction(function () use ($user, $cart, $total) {

                // Validamos el Saldo
                if ($user->wallet_balance < $total) {
                    throw new \Exception('No tienes suficiente saldo.');
                }

                // Cobramos el Saldo (Actualizar Usuario)
                $user->wallet_balance -= $total;
                $user->save();

                // Creamos el Pedido (Order)
                $order = Order::create([
                    'user_id' => $user->id,
                    'total_price' => $total,
                    'status' => 'completed'
                ]);

                // Movemos los Items (OrderItem)
                foreach ($cart->items as $item) {
                    orderItem::create([
                        'order_id' => $order->id,
                        'booster_pack_id' => $item->booster_pack_id,
                        'quantity' => $item->quantity,
                        'price_at_purchase' => $item->boosterPack->price // Guardamos precio histórico
                    ]);
                }

                // Creamos el registro de Transacción (WalletTransaction)
                // Usamos create() directo asumiendo que tienes el modelo WalletTransaction
                walletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'PURCHASE_PACK', // O el tipo que uséis en el ENUM
                    'amount' => -$total,
                    'balance_after' => $user->wallet_balance,
                    'description' => "Compra Pedido #{$order->id}"
                ]);

                // Vaciamos Carrito (Borramos items primero por FK)
                $cart->items()->delete();
            });

            return redirect()->route('dashboard')->with('success', '¡Compra realizada con éxito!');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
