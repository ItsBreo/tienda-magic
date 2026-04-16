<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MarketTransaction extends Model
{
    protected $fillable = [
        'seller_id',
        'buyer_id',
        'sellable_id',
        'sellable_type',
        'price_total',
        'fee_platform',
        'amount_to_seller',
        'item_details'
    ];

    protected $casts = [
        'price_total' => 'float',
        'fee_platform' => 'float',
        'amount_to_seller' => 'float',
        'item_details' => 'array'
    ];

    /**
     * El item que se vendió.
     */
    public function sellable(): MorphTo
    {
        return $this->morphTo();
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }
}
