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
        'subtotal',
        'tax',
        'total_price',
        'payment_method',
        'status',
        'currency'
    ];

    // Relación: Un pedido tiene muchos items
    public function items(){
        return $this->hasMany(OrderItem::class);
    }

    // Relación: Un pedido pertenece a un usuario
    public function user(){
        return $this->belongsTo(User::class);
    }
}
