<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Exchange extends Model
{
    protected $fillable = [
        'user_id',
        'offered_inventory_card_id',
        'requested_card_id',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function offeredCard()
    {
        return $this->belongsTo(InventoryCard::class, 'offered_inventory_card_id')->withTrashed();
    }

    public function requestedCard()
    {
        return $this->belongsTo(Card::class, 'requested_card_id');
    }

    public function requests()
    {
        return $this->hasMany(ExchangeRequest::class);
    }
}
