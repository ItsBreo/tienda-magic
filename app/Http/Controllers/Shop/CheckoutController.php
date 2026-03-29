<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Http\Requests\Shop\CheckoutProcessRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\BoosterPack;
use App\Models\Order;
use App\Models\OrderItem;

class CheckoutController extends Controller
{
    /**
     * Muestra resumen de checkout con totales calculados y validación.
     *
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function index()
    {
        $user = Auth::user();

        $cart = Cart::with(['items.boosterPack.cardSet'])
                    ->where('user_id', $user->id)
                    ->first();

        if (!$cart || $cart->items->isEmpty()) {
            return response()->json([
                'message' => 'Tu carrito está vacío',
                'data' => [
                    'cart' => null,
                    'items' => [],
                    'subtotal' => 0,
                    'tax' => 0,
                    'total' => 0
                ]
            ], 400);
        }

        // Recalcular precios en el servidor - NUNCA confiar en datos del frontend
        $subtotal = 0;
        $validItems = [];

        foreach ($cart->items as $item) {
            $unitPrice = 0;
            if ($item->booster_pack_id) {
                // Validar que el pack aún existe
                $pack = BoosterPack::find($item->booster_pack_id);
                if (!$pack) {
                    $item->delete();
                    continue;
                }
                $unitPrice = $pack->price;
            } elseif ($item->card_id) {
                // Validar que la carta aún existe
                $card = \App\Models\Card::find($item->card_id);
                if (!$card) {
                    $item->delete();
                    continue;
                }
                $unitPrice = (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.50);
            }

            $itemTotal = $unitPrice * $item->quantity;
            $subtotal += $itemTotal;

            $validItems[] = [
                'id' => $item->id,
                'booster_pack_id' => $item->booster_pack_id,
                'card_id' => $item->card_id,
                'quantity' => $item->quantity,
                'unit_price' => $unitPrice,
                'total_price' => $itemTotal,
                'booster_pack' => $item->boosterPack,
                'card' => $item->card
            ];
        }

        // Si quedaron items huérfanos, actualizar carrito
        if (count($validItems) !== $cart->items->count()) {
            if (empty($validItems)) {
                $cart->delete();
                return response()->json([
                    'message' => 'Tu carrito está vacío',
                    'data' => [
                        'cart' => null,
                        'items' => [],
                        'subtotal' => 0,
                        'tax' => 0,
                        'total' => 0
                    ]
                ], 400);
            }
        }

        $taxRate = 0.21; // 21% IVA
        $tax = $subtotal * $taxRate;
        $total = $subtotal + $tax;

        return response()->json([
            'data' => [
                'cart' => $cart,
                'items' => $validItems,
                'subtotal' => round($subtotal, 2),
                'tax' => round($tax, 2),
                'total' => round($total, 2),
                'tax_rate' => $taxRate,
                'currency' => 'EUR'
            ]
        ]);
    }

    /**
     * Procesa checkout con validación de pago y creación de pedido.
     *
     * @param CheckoutProcessRequest $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function process(CheckoutProcessRequest $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = Auth::user();
                $paymentMethod = $request->validated()['payment_method'];

                // Obtener y validar carrito
                $cart = Cart::with(['items.boosterPack'])
                            ->where('user_id', $user->id)
                            ->lockForUpdate()
                            ->first();

                if (!$cart || $cart->items->isEmpty()) {
                    return response()->json([
                        'message' => 'Tu carrito está vacío'
                    ], 400);
                }

                // Recalcular totales en el servidor - SEGURIDAD CRÍTICA
                $subtotal = 0;
                $validItems = [];

                foreach ($cart->items as $item) {
                    $unitPrice = 0;
                    if ($item->booster_pack_id) {
                        $pack = BoosterPack::lockForUpdate()->find($item->booster_pack_id);
                        if (!$pack) {
                            $item->delete();
                            continue;
                        }
                        $unitPrice = $pack->price;
                    } elseif ($item->card_id) {
                        $card = \App\Models\Card::lockForUpdate()->find($item->card_id);
                        if (!$card) {
                            $item->delete();
                            continue;
                        }
                        $unitPrice = (float) ($card->market_avg_price > 0 ? $card->market_avg_price : 1.50);
                    }

                    // Validación adicional de integridad de precios
                    if ($unitPrice <= 0) {
                        throw new \Exception('Precio inválido detectado para item ID: ' . ($item->booster_pack_id ?? $item->card_id));
                    }

                    $itemTotal = $unitPrice * $item->quantity;
                    $subtotal += $itemTotal;

                    $validItems[] = [
                        'booster_pack_id' => $item->booster_pack_id,
                        'card_id' => $item->card_id,
                        'quantity' => $item->quantity,
                        'unit_price' => $unitPrice,
                        'total_price' => $itemTotal
                    ];
                }

                if (empty($validItems)) {
                    return response()->json([
                        'message' => 'No hay items válidos en el carrito'
                    ], 400);
                }

                // Calcular totales finales
                $taxRate = 0.21;
                $tax = $subtotal * $taxRate;
                $total = $subtotal + $tax;

                // Validar fondos suficientes
                if ($paymentMethod === 'wallet' && $user->wallet_balance < $total) {
                    return response()->json([
                        'message' => 'Fondos insuficientes',
                        'data' => [
                            'required' => round($total, 2),
                            'available' => round($user->wallet_balance, 2)
                        ]
                    ], 400);
                }

                // Validación anti-fraude: limite de compra
                if ($total > 1000) {
                    return response()->json([
                        'message' => 'El monto de la compra excede el límite permitido'
                    ], 400);
                }

                // Procesar pago segun el metodo
                if ($paymentMethod === 'wallet') {
                    // Descontar fondos del wallet
                    $user->wallet_balance -= $total;
                    $user->save();
                }
                // Aqui se integraria Stripe para pago con tarjeta

                // Crear pedido
                $order = Order::create([
                    'user_id' => $user->id,
                    'subtotal' => $subtotal,
                    'tax' => $tax,
                    'total_price' => $total,
                    'payment_method' => $paymentMethod,
                    'status' => 'completed',
                    'currency' => 'EUR'
                ]);

                // Crear items de la orden con precios congelados
                foreach ($validItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'booster_pack_id' => $item['booster_pack_id'],
                        'card_id' => $item['card_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['unit_price'],
                        'total_price' => $item['total_price']
                    ]);
                }

                // Vaciar carrito
                $cart->items()->delete();
                $cart->delete();

                Log::info('Checkout completado exitosamente', [
                    'user_id' => $user->id,
                    'order_id' => $order->id,
                    'total' => $total,
                    'payment_method' => $paymentMethod,
                    'items_count' => count($validItems)
                ]);

                return response()->json([
                    'message' => 'Pedido completado con éxito',
                    'data' => [
                        'order_id' => $order->id,
                        'total' => round($total, 2),
                        'payment_method' => $paymentMethod,
                        'items_count' => count($validItems)
                    ]
                ], 201);

            });

        } catch (\Exception $e) {
            Log::error('Error crítico en proceso de checkout', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->validated()
            ]);

            // No exponer detalles del error al cliente por seguridad
            return response()->json([
                'message' => 'Error al procesar el pago. Por favor, inténtalo de nuevo.',
                'error_code' => 'CHECKOUT_FAILED'
            ], 500);
        }
    }

    /**
     * Procesa checkout fake para demo/pruebas.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function processFakeCheckout(Request $request)
    {
        return DB::transaction(function () use ($request) {
            $user = $request->user();

            if (!$user) {
                return response()->json(['message' => 'Usuario no autenticado'], 401);
            }

            // Obtener carrito del usuario
            $cart = \App\Models\Cart::where('user_id', $user->id)->first();

            if (!$cart) {
                return response()->json(['message' => 'Carrito no encontrado'], 400);
            }

            // Obtener items del carrito con sus packs
            $cartItems = \App\Models\CartItem::with('boosterPack')
                            ->where('cart_id', $cart->id)
                            ->get();

            if ($cartItems->isEmpty()) {
                return response()->json(['message' => 'El carrito está vacío'], 400);
            }

            // Calcular total
            $total = $cartItems->sum(function ($item) {
                return $item->quantity * ($item->boosterPack->price ?? $item->unit_price ?? 0);
            });

            // Crear el Order (Ticket maestro)
            $order = \App\Models\Order::create([
                'user_id' => $user->id,
                'total_price' => $total,
                'status' => 'completed'
            ]);

            // Crear los OrderItems (Líneas del ticket) y actualizar inventario
            foreach ($cartItems as $item) {
                $price = 0;
                if ($item->booster_pack_id) {
                    $price = $item->boosterPack->price;
                } elseif ($item->card_id) {
                    $price = (float) ($item->card->market_avg_price > 0 ? $item->card->market_avg_price : 1.00);
                }

                \App\Models\OrderItem::create([
                    'order_id' => $order->id,
                    'booster_pack_id' => $item->booster_pack_id,
                    'card_id' => $item->card_id,
                    'quantity' => $item->quantity,
                    'price_at_purchase' => $price
                ]);

                // Actualizar inventario del usuario
                if ($item->booster_pack_id) {
                    $inventoryItem = \App\Models\InventoryPack::firstOrNew([
                        'user_id' => $user->id,
                        'booster_pack_id' => $item->booster_pack_id
                    ]);
                    $inventoryItem->quantity = ($inventoryItem->quantity ?? 0) + $item->quantity;
                    $inventoryItem->save();
                } elseif ($item->card_id) {
                    $inventoryCard = \App\Models\InventoryCard::firstOrNew([
                        'user_id' => $user->id,
                        'card_id' => $item->card_id
                    ]);
                    $inventoryCard->quantity = ($inventoryCard->quantity ?? 0) + $item->quantity;
                    $inventoryCard->save();
                }
            }

            // Crítico: Vaciar el carrito
            \App\Models\CartItem::where('cart_id', $cart->id)->delete();

            return response()->json([
                'message' => '¡Pedido completado con éxito! (Modo Demo)',
                'order_id' => $order->id,
                'total' => $total,
                'items_count' => $cartItems->count()
            ], 200);
        });
    }

    /**
     * Muestra detalles del pedido para el usuario autenticado.
     *
     * @param int $orderId
     * @return \Illuminate\Http\JsonResponse
     * @throws \Exception
     */
    public function show($orderId)
    {
        try {
            $user = Auth::user();

            $order = Order::with(['items.boosterPack.cardSet'])
                          ->where('id', $orderId)
                          ->where('user_id', $user->id)
                          ->first();

            if (!$order) {
                return response()->json([
                    'message' => 'Pedido no encontrado'
                ], 404);
            }

            return response()->json([
                'data' => [
                    'order' => $order
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error al obtener detalles del pedido', [
                'user_id' => Auth::id(),
                'order_id' => $orderId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Error al obtener los detalles del pedido'
            ], 500);
        }
    }
}
