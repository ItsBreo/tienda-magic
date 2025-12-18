<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Card extends Model
{
    // Permitir asignación masiva para todos los campos
    protected $guarded = [];

    // CASTS: La parte más importante
    protected $casts = [
        'data' => 'array',               // <--- LA CLAVE: Convierte JSON DB <-> Array PHP
        'market_avg_price' => 'decimal:2',
        'mana_value' => 'float',
    ];

    public function cardSet()
    {
        return $this->belongsTo(CardSet::class);
    }
}
