<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CartItemStoreRequest;
use App\Http\Requests\Shop\CartItemUpdateRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\BoosterPack;

class CartController extends Controller
{
    /**
     * Muestra carrito del usuario con items y totales calculados.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $user = Auth::user();

        $cart = Cart::with(['items.boosterPack.cardSet', 'items.card.cardSet'])
                    ->where('user_id', $user->id)
                    ->first();

        if (!$cart) {
            return response()->json([
                'data' => [
                    'cart' => null,
                    'items' => [],
                    'subtotal' => 0,
                    'total' => 0
                ]
            ]);
        }

        // Recalcular precios en el servidor para seguridad
        $subtotal = 0;
        $items = [];

        foreach ($cart->items as $item) {
            $unitPrice = 0;
            $name = '';
            
            if ($item->booster_pack_id) {
                $pack = BoosterPack::find($item->booster_pack_id);
                if (!$pack) {
                    $item->delete();
                    continue;
                }
                $unitPrice = $pack->price;
                $name = $pack->name;
            } elseif ($item->card_id) {
                $card = \App\Models\Card::find($item->card_id);
                if (!$card) {
                    $item->delete();
                    continue;
                }
                $unitPrice = (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.00);
                $name = $card->name;
            } else {
                $item->delete();
                continue;
            }

            $itemTotal = $unitPrice * $item->quantity;
            $subtotal += $itemTotal;

            $items[] = [
                'id' => $item->id,
                'booster_pack_id' => $item->booster_pack_id,
                'card_id' => $item->card_id,
                'name' => $name,
                'quantity' => $item->quantity,
                'unit_price' => $unitPrice,
                'total_price' => $itemTotal,
                'booster_pack' => $item->boosterPack,
                'card' => $item->card
            ];
        }

        return response()->json([
            'data' => [
                'cart' => $cart,
                'items' => $items,
                'subtotal' => $subtotal,
                'total' => $subtotal
            ]
        ]);
    }

    /**
     * Añade item al carrito o actualiza cantidad existente.
     *
     * @param CartItemStoreRequest $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function store(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = Auth::user();
                $boosterPackId = $request->input('booster_pack_id');
                $cardId = $request->input('card_id');
                $quantity = $request->input('quantity', 1);

                if (!$boosterPackId && !$cardId) {
                    return response()->json(['message' => 'Producto no especificado'], 400);
                }

                $cart = Cart::firstOrCreate(['user_id' => $user->id]);

                // Buscar item existente
                $existingItem = CartItem::where('cart_id', $cart->id)
                                      ->when($boosterPackId, function($q) use ($boosterPackId) {
                                          return $q->where('booster_pack_id', $boosterPackId);
                                      })
                                      ->when($cardId, function($q) use ($cardId) {
                                          return $q->where('card_id', $cardId);
                                      })
                                      ->lockForUpdate()
                                      ->first();

                if ($existingItem) {
                    $existingItem->quantity += $quantity;
                    $existingItem->save();
                } else {
                    CartItem::create([
                        'cart_id' => $cart->id,
                        'booster_pack_id' => $boosterPackId,
                        'card_id' => $cardId,
                        'quantity' => $quantity
                    ]);
                }

                return response()->json([
                    'message' => 'Producto añadido al carrito',
                ], 201);

            });
        } catch (\Exception $e) {
            Log::error('Error al añadir item al carrito: ' . $e->getMessage());
            return response()->json(['message' => 'Error al procesar la solicitud'], 500);
        }
    }

    /**
     * Actualiza cantidad de item del carrito.
     *
     * @param int $id
     * @param CartItemUpdateRequest $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function update($id, CartItemUpdateRequest $request)
    {
        try {
            return DB::transaction(function () use ($id, $request) {
                $user = Auth::user();
                $quantity = $request->validated()['quantity'];

                $cart = Cart::where('user_id', $user->id)->first();
                if (!$cart) {
                    return response()->json(['message' => 'Carrito no encontrado'], 404);
                }

                $item = CartItem::where('cart_id', $cart->id)
                               ->where('id', $id)
                               ->lockForUpdate()
                               ->first();

                if (!$item) {
                    return response()->json(['message' => 'Item no encontrado'], 404);
                }

                $price = 0;
                if ($item->booster_pack_id) {
                    $pack = BoosterPack::lockForUpdate()->find($item->booster_pack_id);
                    if (!$pack) {
                        $item->delete();
                        return response()->json(['message' => 'El pack ya no está disponible'], 404);
                    }
                    $price = $pack->price;
                } else {
                    $card = \App\Models\Card::lockForUpdate()->find($item->card_id);
                    if (!$card) {
                        $item->delete();
                        return response()->json(['message' => 'La carta ya no está disponible'], 404);
                    }
                    $price = (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.50);
                }

                $item->quantity = $quantity;
                $item->save();

                Log::info('Cantidad actualizada en carrito', [
                    'user_id' => $user->id,
                    'cart_item_id' => $id,
                    'new_quantity' => $quantity,
                    'unit_price' => $pack->price
                ]);

                return response()->json([
                    'message' => 'Cantidad actualizada',
                    'data' => [
                        'quantity' => $quantity,
                        'subtotal' => $price * $quantity
                    ]
                ]);
            });
        } catch (\Exception $e) {
            Log::error('Error al actualizar item del carrito', [
                'user_id' => Auth::id(),
                'cart_item_id' => $id,
                'error' => $e->getMessage(),
                'request_data' => $request->validated()
            ]);

            return response()->json([
                'message' => 'Error al procesar la solicitud'
            ], 500);
        }
    }

    /**
     * Elimina item del carrito.
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function destroy($id)
    {
        try {
            $user = Auth::user();
            $cart = Cart::where('user_id', $user->id)->first();

            if (!$cart) {
                return response()->json(['message' => 'Carrito no encontrado'], 404);
            }

            $item = CartItem::where('cart_id', $cart->id)
                           ->where('id', $id)
                           ->first();

            if (!$item) {
                return response()->json(['message' => 'Item no encontrado'], 404);
            }

            $item->delete();

            Log::info('Item eliminado del carrito', [
                'user_id' => $user->id,
                'item_id' => $id
            ]);

            return response()->json(['message' => 'Producto eliminado del carrito']);

        } catch (\Exception $e) {
            Log::error('Error al eliminar item del carrito', [
                'user_id' => Auth::id(),
                'item_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json(['message' => 'Error al eliminar el item'], 500);
        }
    }
}
