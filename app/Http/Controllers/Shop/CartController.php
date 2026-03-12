<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Http\Requests\Shop\CartItemStoreRequest;
use App\Http\Requests\Shop\CartItemUpdateRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\BoosterPack;

class CartController extends Controller
{
    /**
     * Display user cart with items and calculated totals.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $user = Auth::user();

        $cart = Cart::with(['items.boosterPack.cardSet'])
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
            // Validar que el pack aún existe y obtener precio actual
            $pack = BoosterPack::find($item->booster_pack_id);
            if (!$pack) {
                // Eliminar items huérfanos
                $item->delete();
                continue;
            }

            $itemTotal = $pack->price * $item->quantity;
            $subtotal += $itemTotal;

            $items[] = [
                'id' => $item->id,
                'booster_pack_id' => $item->booster_pack_id,
                'quantity' => $item->quantity,
                'unit_price' => $pack->price,
                'total_price' => $itemTotal,
                'booster_pack' => $item->boosterPack
            ];
        }

        return response()->json([
            'data' => [
                'cart' => $cart,
                'items' => $items,
                'subtotal' => $subtotal,
                'total' => $subtotal // Sin IVA por ahora, ajustar según negocio
            ]
        ]);
    }

    /**
     * Add item to cart or update existing item quantity.
     *
     * @param CartItemStoreRequest $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function store(CartItemStoreRequest $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = Auth::user();
                $boosterPackId = $request->validated()['booster_pack_id'];
                $quantity = $request->validated()['quantity'];

                // Validar existencia y disponibilidad del pack
                $pack = BoosterPack::lockForUpdate()->find($boosterPackId);
                if (!$pack) {
                    return response()->json([
                        'message' => 'El pack seleccionado no está disponible'
                    ], 404);
                }

                // Validar stock si aplica (descomentar si se implementa stock)
                // if ($pack->stock < $quantity) {
                //     return response()->json([
                //         'message' => 'Stock insuficiente para este pack'
                //     ], 400);
                // }

                $cart = Cart::firstOrCreate(['user_id' => $user->id]);

                // Buscar item existente o crear nuevo
                $existingItem = CartItem::where('cart_id', $cart->id)
                                      ->where('booster_pack_id', $boosterPackId)
                                      ->lockForUpdate()
                                      ->first();

                if ($existingItem) {
                    // Validar límite de cantidad por item
                    $newQuantity = $existingItem->quantity + $quantity;
                    if ($newQuantity > 99) {
                        return response()->json([
                            'message' => 'No puedes añadir más de 99 unidades del mismo pack'
                        ], 400);
                    }
                    $existingItem->quantity = $newQuantity;
                    $existingItem->save();
                } else {
                    CartItem::create([
                        'cart_id' => $cart->id,
                        'booster_pack_id' => $boosterPackId,
                        'quantity' => $quantity
                    ]);
                }

                Log::info('Item añadido al carrito', [
                    'user_id' => $user->id,
                    'booster_pack_id' => $boosterPackId,
                    'quantity' => $quantity,
                    'unit_price' => $pack->price
                ]);

                return response()->json([
                    'message' => 'Producto añadido al carrito',
                    'data' => [
                        'unit_price' => $pack->price,
                        'quantity' => $quantity,
                        'subtotal' => $pack->price * $quantity
                    ]
                ], 201);

            });
        } catch (\Exception $e) {
            Log::error('Error al añadir item al carrito', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'request_data' => $request->validated()
            ]);

            return response()->json([
                'message' => 'Error al procesar la solicitud'
            ], 500);
        }
    }

    /**
     * Update cart item quantity.
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

                $pack = BoosterPack::lockForUpdate()->find($item->booster_pack_id);
                if (!$pack) {
                    $item->delete();
                    return response()->json(['message' => 'El pack ya no está disponible'], 404);
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
                        'subtotal' => $pack->price * $quantity
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
     * Remove item from cart.
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
