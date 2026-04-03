<?php

namespace App\Http\Controllers\Card;

use App\Http\Controllers\Controller;
use App\Models\BoosterPack;
use App\Models\Card;
use Illuminate\Support\Facades\Log;

class PackController extends Controller
{
    /**
     * Obtener todos los packs disponibles
     */
    public function index()
    {
        try {
            $packs = BoosterPack::with('cardSet')
                ->get()
                ->map(function ($pack) {
                    $config = json_decode($pack->config, true);
                    return [
                        'id' => $pack->id,
                        'name' => $pack->name,
                        'price' => (float) $pack->price,
                        'card_set_id' => $pack->card_set_id,
                        'type' => $pack->type,
                        'image_url' => $pack->cover_image ?? $pack->image_uri ?? '/placeholder-pack.png',
                        'config' => [
                            'commons' => $config['commons'] ?? 10,
                            'uncommons' => $config['uncommons'] ?? 3,
                            'rares' => $config['rare'] ?? 1,
                            'mythic' => $config['mythic'] ?? 0,
                            'foil' => $config['foil'] ?? false,
                            'total_cards' => $config['total_cards'] ?? 14,
                            'description' => $config['description'] ?? 'Standard booster configuration'
                        ],
                    ];
                });

            return response()->json($packs);

        } catch (\Exception $e) {
            Log::error('Error al obtener packs: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al cargar los packs disponibles'
            ], 500);
        }
    }

    /**
     * Obtener todas las cartas disponibles para la tienda
     */
    public function getCards()
    {
        try {
            $cards = \App\Models\Card::with('cardSet')
                ->where('market_avg_price', '>', 0)
                ->orderBy('id', 'desc')
                ->paginate(40)
                ->through(function ($card) {
                    return [
                        'id' => $card->id,
                        'name' => $card->name,
                        'price' => (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.00),
                        'image_url' => $card->image_uri ?? '/placeholder-card.png',
                        'rarity' => $card->rarity,
                        'set_name' => $card->cardSet->name ?? 'Unknown Set',
                        'type_line' => $card->data['type_line'] ?? null,
                    ];
                });

            return response()->json($cards);

        } catch (\Exception $e) {
            \Log::error('Error al obtener cartas: ' . $e->getMessage());
            return response()->json(['message' => 'Error al cargar las cartas'], 500);
        }
    }

    /**
     * Obtener cartas de un set específico
     */
    public function getCardsBySet($setCode)
    {
        try {
            // Buscar el set por código (case-insensitive)
            $cardSet = \App\Models\CardSet::whereRaw('LOWER(code) = ?', [strtolower($setCode)])->first();

            if (!$cardSet) {
                return response()->json(['error' => 'Set not found'], 404);
            }

            $cards = Card::where('set_code', $cardSet->code)
                ->limit(50)
                ->get()
                ->map(function ($card) {
                    return [
                        'id' => $card->id,
                        'name' => $card->name,
                        'image_url' => $card->image_uri ?? '/placeholder-card.png',
                        'rarity' => $card->rarity,
                        'mana_cost' => $card->data['mana_cost'] ?? null,
                        'type_line' => $card->data['type_line'] ?? null,
                        'oracle_text' => $card->data['oracle_text'] ?? null,
                        'stock' => $card->stock ?? 0,
                    ];
                });

            return response()->json($cards);

        } catch (\Exception $e) {
            Log::error('Error al obtener cartas del set: ' . $e->getMessage(), [
                'set_code' => $setCode,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al cargar las cartas del set'
            ], 500);
        }
    }

    /**
     * Obtener pack individual por ID
     */
    public function show($id)
    {
        try {
            $pack = BoosterPack::with('cardSet')->findOrFail($id);

            $config = json_decode($pack->config, true);

            return response()->json([
                'data' => [
                    'id' => $pack->id,
                    'name' => $pack->name,
                    'price' => (float) $pack->price,
                    'card_set_id' => $pack->card_set_id,
                    'type' => $pack->type,
                    'cover_image' => $pack->cover_image,
                    'image_uri' => $pack->image_uri,
                    'description' => $config['description'] ?? null,
                    'config' => [
                        'commons' => $config['commons'] ?? 10,
                        'uncommons' => $config['uncommons'] ?? 3,
                        'rares' => $config['rare'] ?? 1,
                        'mythic' => $config['mythic'] ?? 0,
                        'foil' => $config['foil'] ?? false,
                        'total_cards' => $config['total_cards'] ?? 14,
                        'drops' => $config['drops'] ?? []
                    ],
                    'card_set' => $pack->cardSet
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Pack no encontrado'], 404);
        } catch (\Exception $e) {
            Log::error('Error al obtener pack: ' . $e->getMessage(), [
                'pack_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al cargar el pack'
            ], 500);
        }
    }
}
