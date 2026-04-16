<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Card;
use App\Models\InventoryCard;

class PackOpeningController extends Controller
{
    public function show($orderId)
    {
        $user = Auth::user();

        // Obtener la orden con sus items
        $order = Order::with('items.purchasable.cardSet')
                    ->where('id', $orderId)
                    ->where('user_id', $user->id)
                    ->first();

        if (!$order) {
            return response()->json(['message' => 'Orden no encontrada.'], 404);
        }

        return response()->json([
            'data' => [
                'order' => $order,
            ]
        ]);
    }

    public function openPack(Request $request, $orderId, $orderItemId)
    {
        try {
            $user = Auth::user();

            // Buscamos la orden y el item específico
            $order = Order::where('id', $orderId)
                        ->where('user_id', $user->id)
                        ->first();

            $orderItem = OrderItem::with('purchasable')
                        ->where('id', $orderItemId)
                        ->where('order_id', $orderId)
                        ->first();

            if (!$order || !$orderItem) {
                return response()->json(['error' => 'Pack no encontrado'], 404);
            }

            // Todo en una transacción: si falla la generación, no guardamos nada
            $cards = DB::transaction(function () use ($user, $orderItem) {
                // Generamos las cartas aleatorias del pack
                $generatedCards = $this->generateRandomCards($orderItem->purchasable);

                // Añadimos las cartas al inventario del usuario
                foreach ($generatedCards as $card) {
                    InventoryCard::create([
                        'user_id' => $user->id,
                        'card_id' => $card['id'],
                        'quantity' => $card['quantity'],
                        'obtained_from' => 'pack_opening',
                        'obtained_at' => now(),
                    ]);
                }

                // Marcamos el sobre como abierto para que no lo vuelva a abrir
                $orderItem->update(['opened' => true, 'opened_at' => now()]);

                return $generatedCards;
            });

            event(new \App\Events\PackPurchased($user));

            return response()->json([
                'success' => true,
                'cards' => $cards,
            ]);

        } catch (\Exception $e) {
            // Log para debuggear
            Log::error('Error al abrir pack: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'order_id' => $orderId,
                'order_item_id' => $orderItemId,
                'trace' => $e->getTraceAsString()
            ]);

            // Devolvemos un error genérico al front para no filtrar datos de la BD
            return response()->json([
                'message' => 'Error al abrir el pack. Se ha cancelado la operación.'
            ], 500);
        }
    }

    private function generateRandomCards($boosterPack)
    {
        $config = json_decode($boosterPack->config, true);
        $cards = [];
        $setCode = $boosterPack->card_set_id ?? null;

        // Obtener cartas del set según la configuración
        $query = Card::where('set_code', $setCode);

        // Common cards (10)
        if ($config['common'] > 0) {
            $commonCards = $query->where('rarity', 'common')
                                ->inRandomOrder()
                                ->take($config['common'])
                                ->get();
            foreach ($commonCards as $card) {
                $cards[] = [
                    'id' => $card->id,
                    'name' => $card->name,
                    'rarity' => $card->rarity,
                    'image' => $card->image_uris?->art_crop ?? null,
                    'quantity' => 1,
                ];
            }
        }

        // Uncommon cards (3)
        if ($config['uncommon'] > 0) {
            $uncommonCards = $query->where('rarity', 'uncommon')
                                  ->inRandomOrder()
                                  ->take($config['uncommon'])
                                  ->get();
            foreach ($uncommonCards as $card) {
                $cards[] = [
                    'id' => $card->id,
                    'name' => $card->name,
                    'rarity' => $card->rarity,
                    'image' => $card->image_uris?->art_crop ?? null,
                    'quantity' => 1,
                ];
            }
        }

        // Rare cards (1)
        if ($config['rare'] > 0) {
            $rareCards = $query->where('rarity', 'rare')
                               ->inRandomOrder()
                               ->take($config['rare'])
                               ->get();
            foreach ($rareCards as $card) {
                $cards[] = [
                    'id' => $card->id,
                    'name' => $card->name,
                    'rarity' => $card->rarity,
                    'image' => $card->image_uris?->art_crop ?? null,
                    'quantity' => 1,
                ];
            }
        }

        // Mythic rare (chance basada en 1/8)
        if ($config['mythic'] > 0 && rand(1, 8) === 1) {
            $mythicCards = $query->where('rarity', 'mythic')
                                ->inRandomOrder()
                                ->take($config['mythic'])
                                ->get();
            foreach ($mythicCards as $card) {
                $cards[] = [
                    'id' => $card->id,
                    'name' => $card->name,
                    'rarity' => $card->rarity,
                    'image' => $card->image_uris?->art_crop ?? null,
                    'quantity' => 1,
                ];
            }
        }

        // Foil cards (chance del 15%)
        if (isset($config['foil']) && $config['foil'] > 0 && rand(1, 100) <= 15) {
            $foilCards = $query->inRandomOrder()
                               ->take($config['foil'])
                               ->get();
            foreach ($foilCards as $card) {
                $cards[] = [
                    'id' => $card->id,
                    'name' => $card->name,
                    'rarity' => $card->rarity,
                    'image' => $card->image_uris?->art_crop ?? null,
                    'quantity' => 1,
                    'foil' => true,
                ];
            }
        }

        return $cards;
    }
}
