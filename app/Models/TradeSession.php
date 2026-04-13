<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TradeSession extends Model
{
    protected $fillable = [
        'exchange_request_id',
        'status',
        'user1_confirmed',
        'user2_confirmed',
    ];

    public function exchangeRequest()
    {
        return $this->belongsTo(ExchangeRequest::class);
    }
}
