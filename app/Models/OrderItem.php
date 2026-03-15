<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'booster_pack_id',
        'card_id',
        'quantity',
        'price_at_purchase'
    ];

    public function order() {
        return $this->belongsTo(Order::class);
    }

    public function boosterPack() {
        return $this->belongsTo(BoosterPack::class);
    }

    public function card() {
        return $this->belongsTo(Card::class);
    }
}
