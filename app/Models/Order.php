<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total_price',
        'status'
    ];

    // Relación: Un pedido tiene muchos items
    public function items(){
        return $this->hasMany(orderItem::class);
    }

    // Relación: Un pedido pertenece a un usuario
    public function user(){
        return $this->belongsTo(User::class);
    }
}
