<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

/**
 * Modelo de Booster Pack (Sobre de cartas).
 *
 * Representa los sobres de cartas disponibles en la tienda con su precio,
 * configuración y relación con el set de cartas al que pertenecen.
 */
class BoosterPack extends Model
{
    use SoftDeletes;

    protected $table = 'booster_pack';

    protected $fillable = [
        'name',
        'price',
        'card_set_id',
        'type',
        'config',
        'image_uri',
        'is_active',
    ];

    protected $casts = [
        'config' => 'array',
        'price' => 'float',
        'is_active' => 'boolean',
        'card_set_id' => 'string', // Must stay string — stores set codes like 'msh', not integers
    ];

    protected $appends = ['cover_image', 'image_url'];

    /**
     * Virtual attribute for frontend image consistency.
     */
    public function getImageUrlAttribute()
    {
        return $this->cover_image;
    }

    public function cardSet()
    {
        return $this->belongsTo(CardSet::class, 'card_set_id', 'code');
    }

    /**
     * Alias for cardSet() to ensure naming consistency
     */
    public function set()
    {
        return $this->cardSet();
    }

    // Relación polimórfica inversa con OrderItems
    public function orderItems() {
        return $this->morphMany(OrderItem::class, 'purchasable');
    }

    /**
     * Get cover image for this pack
     */
    public function getCoverImageAttribute()
    {
        if ($this->image_uri) {
            return $this->image_uri;
        }

        // booster_pack.card_set_id stores the set code string (e.g. 'msh'),
        // while cards.set_code is the matching varchar column on cards.
        $setCode = $this->card_set_id;

        // Buscar carta mítica del set para usar como portada
        $mythicCard = \App\Models\Card::where('set_code', $setCode)
            ->where('rarity', 'mythic')
            ->whereNotNull('image_uri')
            ->orderBy('id')
            ->first();

        if ($mythicCard) {
            return $mythicCard->image_uri;
        }

        // Si no hay míticas, buscar una rara
        $rareCard = \App\Models\Card::where('set_code', $setCode)
            ->where('rarity', 'rare')
            ->whereNotNull('image_uri')
            ->orderBy('id')
            ->first();

        if ($rareCard) {
            return $rareCard->image_uri;
        }

        // Si no hay raras, usar cualquier carta con imagen
        $anyCard = \App\Models\Card::where('set_code', $setCode)
            ->whereNotNull('image_uri')
            ->orderBy('id')
            ->first();

        return $anyCard ? $anyCard->image_uri : null;
    }

    // Filtros para búsqueda en catálogo
    public function scopeFilter(Builder $query, array $filters)
    {
        // Filtrar por nombre del pack
        if ($filters['search'] ?? false) {
            $query->where('name', 'like', '%' . $filters['search'] . '%');
        }

        // Filtrar por tipo de pack
        if ($filters['type'] ?? false) {
            $query->where('type', $filters['type']);
        }

        // Por defecto, solo mostrar activos a menos que se indique lo contrario (ej. en admin)
        if (!isset($filters['include_inactive']) || !$filters['include_inactive']) {
            $query->where('is_active', true);
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
                    $query->orderBy('price', 'asc');
                    break;
                case 'price_desc':
                    $query->orderBy('price', 'desc');
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
