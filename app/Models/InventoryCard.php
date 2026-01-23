<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryCard extends Model
{
    protected $table = 'inventory_card'; // Forzamos nombre de tabla singular

    protected $fillable = [
        'user_id',
        'card_id',
        'quantity',
        'quantity_locked',
        'is_foil',
        'condition',
        'language'
    ];

    // Relación: Pertenece a un Usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relación: Es una copia de una Carta genérica
    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
