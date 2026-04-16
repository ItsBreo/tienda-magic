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
     * Abre un sobre del inventario del usuario.
     */
    public function open(Request $request, $id)
    {
        $user = Auth::user();
        
        // Cargar el sobre del inventario con su configuración
        $inventoryPack = InventoryPack::where('user_id', $user->id)
            ->where('id', $id)
            ->with('boosterPack')
            ->first();

        if (!$inventoryPack || $inventoryPack->quantity_available <= 0) {
            return response()->json(['error' => 'No tienes sobres disponibles para abrir'], 404);
        }

        $booster = $inventoryPack->boosterPack;
        if (!$booster) {
            return response()->json(['error' => 'Configuración de sobre no encontrada'], 404);
        }

        // Determinar composición del sobre (MTG Standard: 15 cartas)
        // 1 Rara/Mítica, 3 Infrecuentes, 10 Comunes, 1 Tierra
        $composition = [
            'mythic' => 0,
            'rare' => 1,
            'uncommon' => 3,
            'common' => 10,
            'land' => 1 // En MTG real suele ser una tierra básica o especial
        ];

        // Probabilidad de Mítica (1 de cada 8 sobres)
        if (rand(1, 8) === 1) {
            $composition['mythic'] = 1;
            $composition['rare'] = 0;
        }

        $pulledCards = [];

        try {
            DB::beginTransaction();

            foreach ($composition as $rarity => $count) {
                if ($count <= 0) continue;

                // Buscar el ID numérico del Set si card_set_id es un código (string)
                $rawValue = $booster->card_set_id;
                $realCardSetId = $rawValue;
                
                if ($rawValue && !is_numeric($rawValue)) {
                    // Carga insensible a mayúsculas para PostgreSQL
                    $set = \App\Models\CardSet::whereRaw('LOWER(code) = ?', [strtolower($rawValue)])->first();
                    if ($set) {
                        $realCardSetId = $set->code; // Usamos el code como PK
                    } else {
                        \Log::warning("Set code not found in DB: " . $rawValue);
                    }
                }

                $query = Card::where(function($q) use ($realCardSetId, $rawValue) {
                    if ($realCardSetId && is_numeric($realCardSetId)) {
                        $q->where('card_set_id', $realCardSetId);
                    } elseif ($rawValue) {
                        // Búsqueda insensible a mayúsculas para el código
                        $q->whereRaw('LOWER(set_code) = ?', [strtolower($rawValue)]);
                    }
                });
                
                if ($rarity === 'land') {
                    // Buscar tierras específicas del set (Forest, Island, etc)
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

                $cards = $query->with('set')->inRandomOrder()->limit($count)->get();

                // Si no hay suficientes cartas de esa rareza en el set, rellenamos con comunes
                if ($cards->count() < $count) {
                    $extraQuery = Card::where('rarity', 'common')->inRandomOrder()->limit($count - $cards->count());
                    
                    if ($realCardSetId && is_numeric($realCardSetId)) {
                        $extraQuery->where('card_set_id', $realCardSetId);
                    } elseif ($rawValue) {
                        $extraQuery->whereRaw('LOWER(set_code) = ?', [strtolower($rawValue)]);
                    }

                    $extra = $extraQuery->get();
                    $cards = $cards->concat($extra);
                }

                foreach ($cards as $card) {
                    // Añadir al inventario del usuario
                    // Buscamos si ya tiene una igual para incrementar quantity o crear nueva
                    $invCard = InventoryCard::firstOrCreate(
                        [
                            'user_id' => $user->id,
                            'card_id' => $card->id,
                            'is_foil' => false, // Podríamos añadir lógica de foil aleatorio (15% chance)
                            'condition' => 'NM',
                            'language' => 'ES'
                        ],
                        ['quantity' => 0]
                    );

                    $invCard->increment('quantity');
                    
                    $pulledCards[] = [
                        'id' => $card->id,
                        'name' => $card->name,
                        'rarity' => $card->rarity,
                        'image_uri' => $card->image_uri,
                        'image_uris' => $card->data['image_uris'] ?? null,
                        'set' => $card->set
                    ];
                }
            }

            // Consumir el sobre
            $inventoryPack->decrement('quantity');
            
            DB::commit();

            // Disparar el logro de "Primer Sobre"
            event(new \App\Events\PackPurchased($user));

            return response()->json([
                'success' => true,
                'cards' => $pulledCards,
                'message' => '¡Has abierto un sobre de ' . $booster->name . '!'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al abrir el sobre: ' . $e->getMessage()], 500);
        }
    }
}
