<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Cart;
use App\Models\CartItem;
use Illuminate\Support\Facades\DB;

class OrderFulfillmentService
{
    /**
     * Entregar productos de un pedido al usuario.
     */
    public static function fulfillOrder(Order $order)
    {
        DB::transaction(function () use ($order) {
            $orderItems = $order->items()->with('purchasable')->get();

            foreach ($orderItems as $item) {
                $product = $item->purchasable;

                if ($product instanceof \App\Models\Card) {
                    // Añadir cartas al inventario
                    $inventoryCard = InventoryCard::firstOrNew([
                        'user_id' => $order->user_id,
                        'card_id' => $product->id,
                        'condition' => 'NM',
                        'language' => 'en',
                        'is_foil' => false,
                    ]);
                    $inventoryCard->quantity = ($inventoryCard->quantity ?? 0) + $item->quantity;
                    $inventoryCard->save();
                } elseif ($product instanceof \App\Models\BoosterPack) {
                    // Añadir sobres al inventario
                    $inventoryPack = InventoryPack::firstOrNew([
                        'user_id' => $order->user_id,
                        'booster_pack_id' => $product->id,
                    ]);
                    $inventoryPack->quantity = ($inventoryPack->quantity ?? 0) + $item->quantity;
                    $inventoryPack->save();
                }
            }
        });
    }

    /**
     * Vaciar carrito del usuario.
     */
    public static function clearUserCart($userId)
    {
        // Obtener carrito del usuario
        $cart = Cart::where('user_id', $userId)->first();
        
        if ($cart) {
            // Eliminar items y luego el carrito
            $cart->items()->delete();
            $cart->delete();
        }
    }
}
