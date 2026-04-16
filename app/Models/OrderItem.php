<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'purchasable_type',
        'purchasable_id',
        'quantity',
        'price_at_purchase',
        'opened',
        'opened_at'
    ];

    protected $casts = [
        'price_at_purchase' => 'float',
        'opened' => 'boolean',
        'opened_at' => 'datetime'
    ];

    public function order() {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relación polimórfica principal con los productos.
     */
    public function purchasable() {
        return $this->morphTo();
    }

    /**
     * Helper para acceder al sobre de forma semántica si es de ese tipo.
     */
    public function boosterPack()
    {
        return $this->belongsTo(BoosterPack::class, 'purchasable_id')->where('purchasable_type', BoosterPack::class);
    }

    /**
     * Helper para acceder a la carta de forma semántica si es de ese tipo.
     */
    public function card()
    {
        return $this->belongsTo(Card::class, 'purchasable_id')->where('purchasable_type', Card::class);
    }
}
