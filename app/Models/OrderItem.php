<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'purchasable_type',
        'purchasable_id',
        'quantity',
        'price_at_purchase'
    ];

    public function order() {
        return $this->belongsTo(Order::class);
    }

    // Relación polimórfica con productos (Cards, BoosterPacks, etc.)
    public function purchasable() {
        return $this->morphTo();
    }
}
