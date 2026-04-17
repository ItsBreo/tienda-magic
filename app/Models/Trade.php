<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Trade extends Model
{
    protected $fillable = [
        'sender_id',
        'receiver_id',
        'status',
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function conversation(): HasOne
    {
        return $this->hasOne(Conversation::class);
    }
}
