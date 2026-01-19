<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class boosterPack extends Model
{

    protected $table = 'booster_pack';

    protected $fillable = [
        'name',
        'price',
        'card_set_id',
        'type',
        'config'
    ];

    public function cardSet()
    {
        return $this->belongsTo(cardSet::class);
    }

    // Filtros de busqueda para el catalogController
    public function scopeFilter(Builder $query, array $filters)
    {
        // Busqueda por texto (Nombre)
        if ($filters['search'] ?? false) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        // Filtro por Tipo (ej. 'draft', 'set', 'collector')
        if ($filters['type'] ?? false) {
            $query->where('type', $filters['type']);
        }

        // Ordenar por Precio
        if ($filters['sort'] ?? false) {
            if ($filters['sort'] === 'price_asc') {
                $query->orderBy('price', 'asc');
            } elseif ($filters['sort'] === 'price_desc') {
                $query->orderBy('price', 'desc');
            }
        }
    }

}
