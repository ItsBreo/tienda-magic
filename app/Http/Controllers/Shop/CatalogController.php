<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BoosterPack;
use App\Models\CardSet;
use OpenApi\Attributes as OA;

class CatalogController extends Controller
{
    /**
     * Muestra catálogo de tienda con booster packs filtrados y metadatos.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    #[OA\Get(
        path: "/api/shop",
        summary: "Catálogo de tienda",
        description: "Obtiene el catálogo de tienda, soportando filtrado por cartas sueltas o sobres.",
        tags: ["Shop"]
    )]
    #[OA\Parameter(name: "search", in: "query", description: "Búsqueda por nombre", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "type", in: "query", description: "Tipo de pack o carta", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "sort", in: "query", description: "Ordenamiento", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "category", in: "query", description: "Categoría principal ('packs' o 'cards')", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Parameter(name: "set", in: "query", description: "Filtrar por set", required: false, schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Catálogo listado con paginación y filtros")]
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
                            'description' => ($card->data['type_line'] ?? null) ?? 'Magic Card',
                            'foil' => ($card->data['foil'] ?? null) ?? false,
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
                            'description' => ($config['description'] ?? null) ?? 'Magic Booster Pack',
                            'foil' => ($config['foil'] ?? null) ?? false,
                            'total_cards' => ($config['total_cards'] ?? null) ?? 15,
                        ],
                        'set' => $pack->set
                    ];
                });
        }

        // List of sets and types for filter dropdowns
        $sets = CardSet::where('is_active', true)->select('code as id', 'name', 'code')->get();
        $types = BoosterPack::where('is_active', true)->select('type')->distinct()->pluck('type');

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
