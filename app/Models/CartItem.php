<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class cartItem extends Model
{
    protected $table = 'cart_item';

    protected $fillable = [
        'cart_id',
        'booster_pack_id',
        'quantity'
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function boosterPack()
    {
        return $this->belongsTo(boosterPack::class);
    }
}
