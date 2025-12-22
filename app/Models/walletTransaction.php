<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class walletTransaction extends Model
{
    protected $table = 'wallet_transaction';

    protected $fillable = [
        'user_id',
        'type',
        'amount',
        'balance_after',
        'description'
    ];

    // 3. Relaciones
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
