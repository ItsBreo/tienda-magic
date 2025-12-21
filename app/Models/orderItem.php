<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class orderItem extends Model
{
    protected $fillable = [
        'order_id',
        'booster_pack_id',
        'quantity',
        'price_at_purchase'
    ];

    public function order() {
        return $this->belongsTo(Order::class);
    }

    public function boosterPack() {
        return $this->belongsTo(boosterPack::class);
    }
}
