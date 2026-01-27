<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeckCard extends Model
{
    // La tabla no tiene timestamps
    public $timestamps = false;

    // Nombre de la tabla en la base de datos
    protected $table = 'deck_card';

    // Campos asignables masivamente
    protected $fillable = [
        'deck_id',
        'card_id',
        'quantity',
    ];

    // Casts para conversión de tipos
    protected $casts = [
        'quantity' => 'integer',
    ];

    // =====================
    // RELACIONES
    // =====================

    /**
     * Mazo al que pertenece esta carta
     */
    public function deck()
    {
        return $this->belongsTo(Deck::class);
    }

    /**
     * Carta asociada
     */
    public function card()
    {
        return $this->belongsTo(Card::class);
    }
}
