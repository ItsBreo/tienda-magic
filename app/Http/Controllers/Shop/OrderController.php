<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\WalletTransaction;
use App\Models\InventoryPack;

class OrderController extends Controller
{
    public function store(Request $request)
{
    /**
     * PHPDoc to detect methods from eloquent user auth
     * @var \App\Models\User $user
     **/
    $user = Auth::user();

    // Obtain the user's cart with booster pack details
    $cart = Cart::with('items.boosterPack')->where('user_id', $user->id)->first();

    // Validation Check if cart exists and has items
    if (!$cart || $cart->items->isEmpty()) {
        return response()->json(['message' => 'El carrito está vacío'], 400);
    }

    // Calculate total price
    $total = $cart->items->sum(function ($item) {
        return $item->quantity * $item->boosterPack->price;
    });

    try {
        DB::transaction(function () use ($user, $cart, $total) {

            // Validate wallet balance
            if ($user->wallet_balance < $total) {
                throw new \Exception('No tienes suficiente saldo para esta compra.');
            }

            // Decrement wallet balance
            $user->decrement('wallet_balance', $total);

            // Create Order
            $order = Order::create([
                'user_id' => $user->id,
                'total_price' => $total,
                'status' => 'completed'
            ]);

            // Process each cart item
            foreach ($cart->items as $item) {
                // Create Order Item
                OrderItem::create([
                    'order_id' => $order->id,
                    'booster_pack_id' => $item->booster_pack_id,
                    'quantity' => $item->quantity,
                    'price_at_purchase' => $item->boosterPack->price
                ]);

                // update inventory - add booster packs to user's inventory
                $inventoryPack = InventoryPack::firstOrCreate(
                    [
                        'user_id' => $user->id,
                        'booster_pack_id' => $item->booster_pack_id
                    ],
                    ['quantity' => 0]
                );

                $inventoryPack->increment('quantity', $item->quantity);
            }

            // Record wallet transaction
            WalletTransaction::create([
                'user_id' => $user->id,
                'type' => 'PURCHASE_PACK',
                'amount' => -$total,
                'balance_after' => $user->fresh()->wallet_balance,
                'description' => "Compra Pedido #{$order->id}"
            ]);

            // Clear user's cart
            $cart->items()->delete();
        });

        return response()->json(['message' => '¡Compra realizada con éxito!'], 200);

    } catch (\Exception $e) {
        // Devolver error JSON para API
        return response()->json(['message' => $e->getMessage()], 500);
    }
}
}
