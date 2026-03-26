<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TradeSession extends Model
{
    protected $fillable = [
        'proposer_id',
        'receiver_id',
        'status',
        'proposer_balance',
        'receiver_balance',
        'proposer_confirmed',
        'receiver_confirmed',
        'expires_at',
    ];

    protected $casts = [
        'proposer_confirmed' => 'boolean',
        'receiver_confirmed' => 'boolean',
        'expires_at'         => 'datetime',
        'proposer_balance'   => 'decimal:2',
        'receiver_balance'   => 'decimal:2',
    ];

    public function proposer()
    {
        return $this->belongsTo(User::class, 'proposer_id');
    }

    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function items()
    {
        return $this->hasMany(TradeItem::class);
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }

    public function isMember(int $userId): bool
    {
        return $this->proposer_id === $userId || $this->receiver_id === $userId;
    }
}
