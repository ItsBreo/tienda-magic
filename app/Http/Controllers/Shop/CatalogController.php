<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BoosterPack;
use App\Models\CardSet;

class CatalogController extends Controller
{
    /**
     * Muestra catálogo de tienda con booster packs filtrados y metadatos.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Obtain filters from request
        $filters = $request->only(['search', 'type', 'sort', 'category', 'set']);
        $category = $filters['category'] ?? 'packs';

        $items = [];
        if ($category === 'cards') {
            // Query individual cards
            $items = \App\Models\Card::with('set')
                ->filter($filters)
                ->when($filters['set'] ?? false, function($query, $set) {
                    $setArray = is_string($set) ? explode(',', $set) : (array)$set;
                    $query->whereIn('card_set_id', $setArray);
                })
                ->paginate(48)
                ->withQueryString()
                ->through(function ($card) {
                    return [
                        'id' => $card->id,
                        'card_id' => $card->id,
                        'name' => $card->name,
                        'price' => (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.50),
                        'image_url' => $card->image_uri ?? '/placeholder-card.png',
                        'type' => 'Singles',
                        'rarity' => $card->rarity,
                        'card_set_id' => $card->set->code ?? null,
                        'stock' => $card->stock ?? 0,
                        'config' => [
                            'description' => $card->data['type_line'] ?? 'Magic Card',
                            'foil' => $card->data['foil'] ?? false,
                        ],
                        'set' => $card->set
                    ];
                });
        } else {
            // Query booster packs (default)
            $items = BoosterPack::with('set')
                ->filter($filters)
                ->when($filters['set'] ?? false, function($query, $set) {
                    $setArray = is_string($set) ? explode(',', $set) : (array)$set;
                    $query->whereIn('card_set_id', $setArray);
                })
                ->paginate(48)
                ->withQueryString()
                ->through(function ($pack) {
                    $config = is_string($pack->config) ? json_decode($pack->config, true) : $pack->config;
                    return [
                        'id' => $pack->id,
                        'booster_pack_id' => $pack->id,
                        'name' => $pack->name,
                        'price' => (float) $pack->price,
                        'image_url' => $pack->cover_image ?? '/placeholder-pack.png',
                        'type' => $pack->type ?? 'Booster',
                        'card_set_id' => $pack->card_set_id,
                        'config' => [
                            'description' => $config['description'] ?? 'Magic Booster Pack',
                            'foil' => $config['foil'] ?? false,
                            'total_cards' => $config['total_cards'] ?? 15,
                        ],
                        'set' => $pack->set
                    ];
                });
        }

        // List of sets and types for filter dropdowns
        $sets = CardSet::select('id', 'name', 'code')->get();
        $types = BoosterPack::select('type')->distinct()->pluck('type');

        return response()->json([
            'data' => [
                'items' => $items,
                'filters' => $filters,
                'sets' => $sets,
                'types' => $types,
                'category' => $category
            ]
        ]);
    }
}
