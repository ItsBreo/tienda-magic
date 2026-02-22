<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Card;
use App\Models\InventoryCard;
use Illuminate\Support\Str;

class PackOpeningController extends Controller
{
    public function show($orderId)
    {
        $user = Auth::user();
        
        // Obtener la orden con sus items
        $order = Order::with('items.boosterPack.cardSet')
                    ->where('id', $orderId)
                    ->where('user_id', $user->id)
                    ->first();
                    
        if (!$order) {
            return redirect()->route('dashboard')
                ->with('error', 'Orden no encontrada.');
        }

        return Inertia::render('Shop/PackOpening', [
            'order' => $order,
        ]);
    }

    public function openPack(Request $request, $orderId, $orderItemId)
    {
        $user = Auth::user();
        
        // Obtener la orden y el item específico
        $order = Order::where('id', $orderId)
                    ->where('user_id', $user->id)
                    ->first();
                    
        $orderItem = OrderItem::with('boosterPack')
                    ->where('id', $orderItemId)
                    ->where('order_id', $orderId)
                    ->first();
                    
        if (!$order || !$orderItem) {
            return response()->json(['error' => 'Pack no encontrado'], 404);
        }

        // Generar cartas aleatorias del pack
        $cards = $this->generateRandomCards($orderItem->boosterPack);
        
        // Añadir cartas al inventario del usuario
        foreach ($cards as $card) {
            InventoryCard::create([
                'user_id' => $user->id,
                'card_id' => $card['id'],
                'quantity' => $card['quantity'],
                'obtained_from' => 'pack_opening',
                'obtained_at' => now(),
            ]);
        }

        // Marcar el item como abierto
        $orderItem->update(['opened' => true, 'opened_at' => now()]);

        return response()->json([
            'success' => true,
            'cards' => $cards,
        ]);
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
