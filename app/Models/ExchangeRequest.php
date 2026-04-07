<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExchangeRequest extends Model
{
    protected $fillable = [
        'exchange_id',
        'user_id',
        'offered_inventory_card_id',
        'status',
    ];

    public function exchange()
    {
        return $this->belongsTo(Exchange::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function offeredCard()
    {
        return $this->belongsTo(InventoryCard::class, 'offered_inventory_card_id');
    }

    public function tradeSession()
    {
        return $this->hasOne(TradeSession::class);
    }
}
