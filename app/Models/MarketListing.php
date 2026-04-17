<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class MarketListing extends Model
{
    protected $fillable = [
        'seller_id',
        'buyer_id',
        'listable_id',
        'listable_type',
        'inventory_item_id',
        'price_total',
        'fee_platform',
        'amount_to_seller',
        'status'
    ];

    protected $casts = [
        'price_total' => 'float',
        'fee_platform' => 'float',
        'amount_to_seller' => 'float',
    ];

    /**
     * El item que se está vendiendo (Card o BoosterPack).
     */
    public function listable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * El vendedor del item.
     */
    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    /**
     * El comprador del item (si ya se vendió).
     */
    public function buyer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'buyer_id');
    }

    /**
     * Scope para filtrar listados activos.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
