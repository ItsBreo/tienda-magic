<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Modelo de Carta Magic.
 *
 * Representa cartas individuales con sus atributos, precios de mercado
 * y relación con el set al que pertenecen.
 * Relaciones: CardSet (pertenece), InventoryCard (tiene muchos).
 */
class Card extends Model
{
    // Permitir asignación masiva para todos los campos
    protected $guarded = [];

    // Castear campos
    protected $casts = [
        'data' => 'array',
        'market_avg_price' => 'decimal:2',
        'mana_value' => 'float',
    ];

    public function cardSet()
    {
        return $this->belongsTo(CardSet::class);
    }

    // Relación polimórfica inversa con OrderItems
    public function orderItems() {
        return $this->morphMany(OrderItem::class, 'purchasable');
    }

    public function scopeFilter($query, array $filters) {
        if ($filters['search'] ?? false) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }
        if ($filters['color'] ?? false) {
            $query->where('colors', 'like', '%' . $filters['color'] . '%');
        }
        if ($filters['rarity'] ?? false) {
            $query->where('rarity', $filters['rarity']);
        }

        // Ordenar resultados
        if ($filters['sort'] ?? false) {
            switch ($filters['sort']) {
                case 'name_asc':
                    $query->orderBy('name', 'asc');
                    break;
                case 'name_desc':
                    $query->orderBy('name', 'desc');
                    break;
                case 'price_asc':
                    $query->orderBy('market_avg_price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('market_avg_price', 'desc');
                    break;
                case 'newest':
                    $query->orderBy('id', 'desc');
                    break;
                default:
                    $query->orderBy('id', 'desc');
                    break;
            }
        } else {
            $query->orderBy('id', 'desc');
        }
    }
}
