<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class CardPriceHistory extends Model
{
    protected $table = 'card_price_history';
    public $timestamps = false; // Usamos recorded_at manualmente

    protected $fillable = [
        'priceable_id',
        'priceable_type',
        'price',
        'recorded_at'
    ];

    protected $casts = [
        'price' => 'float',
        'recorded_at' => 'datetime'
    ];

    /**
     * El objeto al que pertenece el precio (Card o BoosterPack).
     */
    public function priceable(): MorphTo
    {
        return $this->morphTo();
    }
}
