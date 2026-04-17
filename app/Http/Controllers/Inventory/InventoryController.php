<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Card;
use App\Models\CardSet;
use App\Models\User;
use App\Models\Market;
use OpenApi\Attributes as OA;

class InventoryController extends Controller
{
    /**
     * Muestra inventario del usuario autenticado.
     * v3.5 - FIX: Detección inteligente de ID numérico vs Código de texto para filtros de Set.
     */
    public function index(Request $request)
    {
        try {
            $user = Auth::user();
            $searchTerm = $request->input('search');
            $selectedSets = $request->input('sets'); 
            $sortBy = $request->input('sort', 'newest');

            // --- 1. NORMALIZACIÓN DE FILTROS ---
            if (!empty($selectedSets)) {
                if (is_string($selectedSets)) {
                    $selectedSets = array_values(array_filter(explode(',', $selectedSets)));
                }
            } else {
                $selectedSets = [];
            }

            // Separar IDs (números) de Códigos (letras)
            $numericIds = [];
            $stringCodes = [];

            foreach ($selectedSets as $val) {
                if (is_numeric($val)) {
                    $numericIds[] = (int)$val;
                } else {
                    $stringCodes[] = $val;
                }
            }

            // Unificar todos en Códigos para la tabla 'cards' que usa codes
            $finalSetCodes = $stringCodes;
            if (!empty($numericIds)) {
                $extraCodes = CardSet::whereIn('id', $numericIds)->pluck('code')->toArray();
                $finalSetCodes = array_unique(array_merge($finalSetCodes, $extraCodes));
            }

            // Unificar todos en IDs para la tabla 'booster_pack' (aunque BoosterPack suele usar codes también, 
            // algunas implementaciones usan IDs. Mantenemos compatibilidad)
            $finalSetIds = $numericIds;
            if (!empty($stringCodes)) {
                $extraIds = CardSet::whereIn('code', $stringCodes)->pluck('id')->toArray();
                $finalSetIds = array_unique(array_merge($finalSetIds, $extraIds));
            }

            // --- 2. CONSULTA DE CARTAS ---
            $cardQuery = InventoryCard::where('inventory_card.user_id', $user->id)
                ->where('inventory_card.quantity', '>', 0)
                ->leftJoin('cards', 'inventory_card.card_id', '=', 'cards.id')
                ->select('inventory_card.*') 
                ->with(['card.set']);

            if (!empty($searchTerm)) {
                $cardQuery->where('cards.name', 'ILIKE', '%' . $searchTerm . '%');
            }

            if (!empty($finalSetCodes)) {
                $lowerSetCodes = array_map('strtolower', $finalSetCodes);
                $cardQuery->whereHas('card', function($q) use ($lowerSetCodes) {
                    $q->whereIn(DB::raw('LOWER(cards.set_code)'), $lowerSetCodes);
                });
            }

            // Ordenamiento Cartas
            switch ($sortBy) {
                case 'name_asc': $cardQuery->orderBy('cards.name', 'asc'); break;
                case 'name_desc': $cardQuery->orderBy('cards.name', 'desc'); break;
                case 'price_asc': $cardQuery->orderBy('cards.market_avg_price', 'asc'); break;
                case 'price_desc': $cardQuery->orderBy('cards.market_avg_price', 'desc'); break;
                case 'newest': default: $cardQuery->orderBy('inventory_card.id', 'desc'); break;
            }

            $inventoryCardsPaginated = $cardQuery->paginate(15);

            // Transfomar para paridad
            $inventoryCardsFormatted = $inventoryCardsPaginated->through(function($item) {
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'quantity_locked' => $item->quantity_locked,
                    'is_foil' => $item->is_foil,
                    'card' => $item->card ? [
                        'id' => $item->card->id,
                        'name' => $item->card->name,
                        'image_url' => $item->card->image_url,
                        'image_uri' => $item->card->image_uri,
                        'image_uris' => $item->card->data['image_uris'] ?? null,
                        'rarity' => $item->card->rarity,
                        'market_avg_price' => $item->card->market_avg_price,
                        'set' => $item->card->set,
                        'data' => $item->card->data
                    ] : null
                ];
            });

            // --- 3. CONSULTA DE SOBRES ---
            $packQuery = InventoryPack::where('inventory_pack.user_id', $user->id)
                ->where('inventory_pack.quantity', '>', 0)
                ->leftJoin('booster_pack', 'inventory_pack.booster_pack_id', '=', 'booster_pack.id')
                ->select('inventory_pack.*')
                ->with('boosterPack.set');

            if (!empty($searchTerm)) {
                $packQuery->where('booster_pack.name', 'ILIKE', '%' . $searchTerm . '%');
            }

            if (!empty($finalSetCodes)) {
                $lowerPackSets = array_map('strtolower', $finalSetCodes);
                $packQuery->whereHas('boosterPack', function($q) use ($lowerPackSets) {
                    $q->whereIn(DB::raw('LOWER(booster_pack.card_set_id)'), $lowerPackSets);
                });
            }

            // Ordenamiento Sobres
            switch ($sortBy) {
                case 'name_asc': $packQuery->orderBy('booster_pack.name', 'asc'); break;
                case 'name_desc': $packQuery->orderBy('booster_pack.name', 'desc'); break;
                case 'price_asc': $packQuery->orderBy('booster_pack.price', 'asc'); break;
                case 'price_desc': $packQuery->orderBy('booster_pack.price', 'desc'); break;
                case 'newest': default: $packQuery->orderBy('inventory_pack.id', 'desc'); break;
            }

            $inventoryPacksPaginated = $packQuery->paginate(15, ['*'], 'packs_page');

            $formattedPacks = $inventoryPacksPaginated->through(function($item) {
                return [
                    'id' => $item->id,
                    'quantity' => $item->quantity,
                    'quantity_locked' => $item->quantity_locked,
                    'booster_pack' => $item->boosterPack ? [
                        'id' => $item->boosterPack->id,
                        'name' => $item->boosterPack->name,
                        'price' => $item->boosterPack->price,
                        'image_uri' => $item->boosterPack->image_uri,
                        'type' => $item->boosterPack->type,
                        'set' => $item->boosterPack->set
                    ] : null
                ];
            });

            return response()->json([
                'inventoryCards' => $inventoryCardsFormatted,
                'inventoryPacks' => $formattedPacks,
                'stats' => [
                    'totalCards' => InventoryCard::where('user_id', $user->id)->sum('quantity'),
                    'totalPacks' => InventoryPack::where('user_id', $user->id)->sum('quantity'),
                ]
            ]);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Inventory Error: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar el inventario: ' . $e->getMessage()], 500);
        }
    }

    public function stats()
    {
        $user = Auth::user();
        return response()->json([
            'totalCards' => InventoryCard::where('user_id', $user->id)->sum('quantity'),
            'totalPacks' => InventoryPack::where('user_id', $user->id)->sum('quantity'),
        ]);
    }
}
