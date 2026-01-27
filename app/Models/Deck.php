<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Deck extends Model
{
    // La tabla no tiene timestamps
    public $timestamps = false;

    // Nombre de la tabla en la base de datos
    protected $table = 'deck';

    // Campos asignables masivamente
    protected $fillable = [
        'user_id',
        'name',
        'is_public',
    ];

    // Casts para conversión de tipos
    protected $casts = [
        'is_public' => 'boolean',
    ];

    // =====================
    // RELACIONES
    // =====================

    /**
     * Usuario dueño del mazo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con la tabla pivot deck_card (registros individuales)
     */
    public function deckCards()
    {
        return $this->hasMany(DeckCard::class);
    }

    /**
     * Cartas del mazo (relación muchos a muchos con cantidad)
     */
    public function cards()
    {
        return $this->belongsToMany(Card::class, 'deck_card')
            ->withPivot('quantity');
    }

    // =====================
    // HELPERS
    // =====================

    /**
     * Obtener el número total de cartas en el mazo
     */
    public function getTotalCardsAttribute(): int
    {
        return $this->deckCards->sum('quantity');
    }
}
