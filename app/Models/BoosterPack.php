<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BoosterPack extends Model
{
    // La tabla no tiene timestamps
    public $timestamps = false;

    // Nombre de la tabla en la base de datos
    protected $table = 'booster_pack';

    // Campos asignables masivamente
    protected $fillable = [
        'name',
        'price',
        'card_set_id',
        'type',
        'config',
    ];

    // Casts para conversión de tipos
    protected $casts = [
        'price' => 'float',
        'config' => 'array', // Convierte JSON <-> Array PHP
    ];

    // =====================
    // RELACIONES
    // =====================

    /**
     * Set de cartas al que pertenece este sobre
     */
    public function cardSet()
    {
        return $this->belongsTo(CardSet::class);
    }

    /**
     * Packs en inventarios de usuarios
     */
    public function inventoryPacks()
    {
        return $this->hasMany(InventoryPack::class);
    }
}
