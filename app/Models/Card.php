<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo de Carta Magic.
 *
 * Representa cartas individuales con sus atributos, precios de mercado
 * y relación con el set al que pertenecen.
 * Relaciones: CardSet (pertenece), InventoryCard (tiene muchos).
 */
class Card extends Model
{
    use SoftDeletes;

    // Permitir asignación masiva para todos los campos
    protected $guarded = [];

    // Castear campos
    protected $casts = [
        'data' => 'array',
        'market_avg_price' => 'float',
        'mana_value' => 'float',
        'is_active' => 'boolean',
    ];

    protected $appends = ['image_url'];

    /**
     * Get the image_url for the card (alias for image_uri for frontend compatibility).
     */
    public function getImageUrlAttribute()
    {
        return $this->image_uri;
    }

    /**
     * Get the set information for this card.
     */
    public function cardSet()
    {
        return $this->belongsTo(CardSet::class, 'set_code', 'code');
    }

    /**
     * Required for with('card.set') to work in controllers and frontend consistency.
     */
    public function set()
    {
        return $this->cardSet();
    }

    // Relación polimórfica inversa con OrderItems
    public function orderItems() {
        return $this->morphMany(OrderItem::class, 'purchasable');
    }

    public function scopeFilter($query, array $filters) {
        if ($filters['search'] ?? false) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        // Filtro de actividad (Cascada: el set debe estar activo para que la carta se considere activa en tienda)
        if (!($filters['include_inactive'] ?? false)) {
            $query->where('is_active', true)
                  ->whereHas('cardSet', function($q) {
                      $q->where('is_active', true);
                  });
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
