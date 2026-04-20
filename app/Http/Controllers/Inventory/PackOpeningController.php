<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryPack;
use App\Models\InventoryCard;
use App\Models\Card;
use App\Models\BoosterPack;
use Illuminate\Support\Facades\Log;

class PackOpeningController extends Controller
{
    /**
     * Abre uno o varios sobres del inventario del usuario.
     * SOPORTE: Devolución estructurada por SOBRES para UI de Carrusel. (v3.2)
     */
    public function open(Request $request, $id)
    {
        $user = Auth::user();
        $count = $request->input('count', 1);

        if ($count <= 0 || $count > 100) {
            return response()->json(['error' => 'Cantidad inválida'], 400);
        }
        
        $inventoryPack = InventoryPack::where('user_id', $user->id)
            ->where('id', $id)
            ->with('BoosterPack')
            ->first();

        if (!$inventoryPack || ($inventoryPack->quantity - $inventoryPack->quantity_locked) < $count) {
            return response()->json(['error' => 'No tienes suficientes sobres disponibles (algunos pueden estar en venta o intercambio)'], 422);
        }

        $booster = $inventoryPack->BoosterPack;
        
        // Composición estándar
        $compositionBase = [
            'mythic' => 0,
            'rare' => 1,
            'uncommon' => 3,
            'common' => 10,
            'land' => 1
        ];

        $results = []; // Array de sobres: [ { packIndex: 1, cards: [...] }, ... ]

        try {
            DB::beginTransaction();

            for ($i = 0; $i < $count; $i++) {
                $packCards = [];
                $composition = $compositionBase;
                
                if (rand(1, 8) === 1) {
                    $composition['mythic'] = 1;
                    $composition['rare'] = 0;
                }

                foreach ($composition as $rarity => $cardsCount) {
                    if ($cardsCount <= 0) continue;

                    $rawValue = $booster->card_set_id;
                    $realCardSetId = $rawValue;
                    
                    if ($rawValue && !is_numeric($rawValue)) {
                        $set = \App\Models\CardSet::whereRaw('LOWER(code) = ?', [strtolower($rawValue)])->first();
                        if ($set) $realCardSetId = $set->code; 
                    }

                    $query = Card::where(function($q) use ($realCardSetId, $rawValue) {
                        if ($realCardSetId && is_numeric($realCardSetId)) $q->where('card_set_id', $realCardSetId);
                        elseif ($rawValue) $q->whereRaw('LOWER(set_code) = ?', [strtolower($rawValue)]);
                    });
                    
                    if ($rarity === 'land') {
                        $query->where(function($q) {
                            $q->where('name', 'ILIKE', '%Forest%')
                              ->orWhere('name', 'ILIKE', '%Island%')
                              ->orWhere('name', 'ILIKE', '%Swamp%')
                              ->orWhere('name', 'ILIKE', '%Mountain%')
                              ->orWhere('name', 'ILIKE', '%Plains%');
                        });
                    } else {
                        $query->where('rarity', $rarity);
                    }

                    $pulled = $query->with('set')->inRandomOrder()->limit($cardsCount)->get();

                    foreach ($pulled as $card) {
                        $invCard = InventoryCard::firstOrCreate(
                            ['user_id' => $user->id, 'card_id' => $card->id, 'is_foil' => false, 'condition' => 'NM', 'language' => 'ES'],
                            ['quantity' => 0]
                        );
                        $invCard->increment('quantity');
                        
                        $packCards[] = [
                            'id' => $card->id,
                            'name' => $card->name,
                            'rarity' => $card->rarity,
                            'image_uri' => $card->image_uri,
                            'image_uris' => $card->data['image_uris'] ?? null,
                            'set' => $card->set
                        ];
                    }
                }
                
                $results[] = [
                    'index' => $i + 1,
                    'cards' => $packCards
                ];
            }

            $inventoryPack->decrement('quantity', $count);
            DB::commit();

            return response()->json([
                'success' => true,
                'packs' => $results, // Estructura mejorada
                'count' => $count,
                'message' => "¡Has abierto $count sobres de " . $booster->name . "!"
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error: ' . $e->getMessage()], 500);
        }
    }
}
