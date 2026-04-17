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

    /**
     * Verifica si el usuario dado es participante de este intercambio.
     */
    public function isMember($userId)
    {
        return $this->exchangeRequest->user_id === (int)$userId || 
               $this->exchangeRequest->exchange->user_id === (int)$userId;
    }
}
