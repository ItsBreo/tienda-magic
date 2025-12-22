<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class depositOrder extends Model
{
    protected $table = 'deposit_order';

    protected $fillable = [
        'user_id',
        'amount_eur',
        'payment_method',
        'status',
        'transaction_ref'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
