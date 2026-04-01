<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\BoosterPack;
use App\Models\Card;

class CartItem extends Model
{
    protected $table = 'cart_item';

    protected $fillable = [
        'cart_id',
        'booster_pack_id',
        'card_id',
        'quantity'
    ];

    public function cart()
    {
        return $this->belongsTo(Cart::class);
    }

    public function boosterPack()
    {
        return $this->belongsTo(BoosterPack::class);
    }

    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
