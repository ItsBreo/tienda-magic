<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo de Pedido de compra.
 *
 * Representa pedidos completados con sus items, totales y estado.
 * Relaciones: User (pertenece) y OrderItems (tiene muchos).
 */
class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_amount',
        'payment_method',
        'payment_status',
        'stripe_session_id',
        'status',
        'billing_name',
        'billing_tax_id',
        'billing_address'
    ];
    
    protected $casts = [
        'total_amount' => 'float',
    ];

    // Relación: Un pedido tiene muchos items
    public function items(){
        return $this->hasMany(OrderItem::class);
    }

    // Relación: Un pedido pertenece a un usuario
    public function user(){
        return $this->belongsTo(User::class);
    }

    /**
     * Entrega los productos del pedido al usuario y vacía su carrito.
     */
    public function fulfill()
    {
        $orderItems = $this->items()->with('purchasable')->get();

        foreach ($orderItems as $item) {
            $product = $item->purchasable;

            // Deduct stock safely
            if (isset($product->stock)) {
                $deductAmount = min($product->stock, $item->quantity);
                if ($deductAmount > 0) {
                    $product->decrement('stock', $deductAmount);
                }
            }

            if ($product instanceof Card) {
                // Add to inventory
                $inventoryCard = InventoryCard::firstOrNew([
                    'user_id' => $this->user_id,
                    'card_id' => $product->id,
                    'condition' => 'NM',
                    'language' => 'en',
                    'is_foil' => false,
                ]);
                $inventoryCard->quantity = ($inventoryCard->quantity ?? 0) + $item->quantity;
                $inventoryCard->save();
            } elseif ($product instanceof BoosterPack) {
                // Add pack to inventory
                $inventoryPack = InventoryPack::firstOrNew([
                    'user_id' => $this->user_id,
                    'booster_pack_id' => $product->id,
                ]);
                $inventoryPack->quantity = ($inventoryPack->quantity ?? 0) + $item->quantity;
                $inventoryPack->save();
            }
        }

        // Vaciar carrito
        $cart = Cart::where('user_id', $this->user_id)->first();
        if ($cart) {
            $cart->items()->delete();
            $cart->delete();
        }
    }
}
