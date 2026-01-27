<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CardSet extends Model
{
    // Nombre de la tabla en la base de datos
    protected $table = 'card_sets';

    // Campos asignables masivamente
    protected $fillable = [
        'code',
        'name',
        'released_at',
    ];

    // Casts para conversión de tipos
    protected $casts = [
        'released_at' => 'date',
    ];

    // =====================
    // RELACIONES
    // =====================

    /**
     * Cartas que pertenecen a este set
     */
    public function cards()
    {
        return $this->hasMany(Card::class);
    }

    /**
     * Booster packs de este set
     */
    public function boosterPacks()
    {
        return $this->hasMany(BoosterPack::class);
    }
}
