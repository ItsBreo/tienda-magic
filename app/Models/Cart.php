<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo de Carrito de compras.
 *
 * Representa el carrito activo de un usuario con sus items.
 * Relación principal: User y CartItems.
 */
class Cart extends Model
{
    protected $table = 'cart';

    protected $fillable = ['user_id'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function items()
    {
        return $this->hasMany(CartItem::class);
    }
}
