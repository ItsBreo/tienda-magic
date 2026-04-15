<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Cart;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use OpenApi\Attributes as OA;

class CheckoutController extends Controller
{
    #[OA\Post(
        path: "/api/checkout/process",
        summary: "Procesar Checkout",
        description: "Procesamiento híbrido de checkout combinando billetera virtual o Stripe con alta seguridad.",
        tags: ["Checkout"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "payment_method", type: "string", description: "wallet o stripe", example: "wallet"),
            new OA\Property(
                property: "items",
                type: "array",
                items: new OA\Items(properties: [
                    new OA\Property(property: "purchasable_type", type: "string", example: "App\\Models\\Card"),
                    new OA\Property(property: "purchasable_id", type: "integer", example: 1),
                    new OA\Property(property: "quantity", type: "integer", example: 1)
                ])
            )
        ])
    )]
    #[OA\Response(response: 200, description: "Compra procesada o sesión de pago iniciada")]
    #[OA\Response(response: 422, description: "Datos de orden inválidos o stock insuficiente")]
    public function processCheckout(Request $request)
    {
        $validated = $request->validate([
            'payment_method' => 'required|in:wallet,stripe',
            'items' => 'required|array|min:1',
            'items.*.purchasable_type' => 'required|in:App\\Models\\Card,App\\Models\\BoosterPack',
            'items.*.purchasable_id' => 'required|integer',
            'items.*.quantity' => 'required|integer|min:1'
        ]);

        try {
            return DB::transaction(function () use ($validated, $request) {
                $user = \App\Models\User::lockForUpdate()->find($request->user()->id);
                $totalAmount = 0;
                $orderItems = [];

                // Validación de stock para cartas sueltas
                foreach ($validated['items'] as $item) {
                    if ($item['purchasable_type'] === 'App\\Models\\Card') {
                        $card = Card::find($item['purchasable_id']);

                        if (!$card) {
                            throw new \Exception("Carta no encontrada: ID {$item['purchasable_id']}");
                        }

                        if (($card->stock ?? 0) < $item['quantity']) {
                            throw new \Exception("Stock insuficiente para '{$card->name}'. Stock disponible: {$card->stock}, solicitado: {$item['quantity']}");
                        }
                    }
                }

                // Calcular precios reales - Nunca fiarse del front
                foreach ($validated['items'] as $item) {
                    $model = $item['purchasable_type']::find($item['purchasable_id']);

                    if (!$model) {
                        throw new \Exception("Producto no encontrado: {$item['purchasable_type']} ID {$item['purchasable_id']}");
                    }

                    // Obtener precio según tipo
                    $unitPrice = $model instanceof Card ?
                        ($model->market_avg_price > 0 ? $model->market_avg_price : 1.50) :
                        $model->price;

                    if ($unitPrice <= 0) {
                        throw new \Exception("Precio inválido para producto ID {$item['purchasable_id']}");
                    }

                    $itemTotal = $unitPrice * $item['quantity'];
                    $totalAmount += $itemTotal;

                    // Guardar para crear OrderItems después
                    $orderItems[] = [
                        'purchasable_type' => $item['purchasable_type'],
                        'purchasable_id' => $item['purchasable_id'],
                        'quantity' => $item['quantity'],
                        'unit_price' => $unitPrice,
                        'total_price' => $itemTotal
                    ];
                }

                // Anti-fraude: límite de compra
                if ($totalAmount > 1000) {
                    throw new \Exception('Monto excede límite permitido');
                }

                // Crear orden con estado pending
                $order = Order::create([
                    'user_id' => $user->id,
                    'total_amount' => $totalAmount,
                    'payment_method' => $validated['payment_method'],
                    'payment_status' => 'pending',
                    'status' => 'pending'
                ]);

                // Crear items con precios congelados
                foreach ($orderItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'purchasable_type' => $item['purchasable_type'],
                        'purchasable_id' => $item['purchasable_id'],
                        'quantity' => $item['quantity'],
                        'price_at_purchase' => $item['unit_price']
                    ]);
                }

                // Bifurcación de pago
                if ($validated['payment_method'] === 'wallet') {
                    // Si no hay pasta, abortamos misión
                    if ($user->wallet_balance < $totalAmount) {
                        throw new \Exception('Saldo insuficiente');
                    }

                    // Descontar saldo
                    $user->decrement('wallet_balance', $totalAmount);

                    // Marcar como completado
                    $order->update([
                        'payment_status' => 'completed',
                        'status' => 'completed'
                    ]);

                    // Entregar productos y limpiar carrito
                    $this->fulfillOrder($order);

                    return response()->json([
                        'success' => true,
                        'message' => 'Pago con wallet completado',
                        'order_id' => $order->id,
                        'total_amount' => $totalAmount
                    ]);
                } else {
                    // Pago con Stripe - crear sesión
                    Stripe::setApiKey(config('services.stripe.secret'));

                    $session = Session::create([
                        'payment_method_types' => ['card'],
                        'line_items' => [[
                            'price_data' => [
                                'currency' => 'eur',
                                'product_data' => [
                                    'name' => 'Pedido #' . $order->id,
                                    'description' => count($orderItems) . ' productos'
                                ],
                                'unit_amount' => $totalAmount * 100, // Stripe usa centavos
                            ],
                            'quantity' => 1,
                        ]],
                        'mode' => 'payment',
                        'success_url' => route('checkout.success') . '?session_id={CHECKOUT_SESSION_ID}',
                        'cancel_url' => route('checkout.cancel'),
                        'metadata' => [
                            'order_id' => $order->id,
                            'type' => 'order'
                        ]
                    ]);

                    // Guardar session_id en la orden
                    $order->update(['stripe_session_id' => $session->id]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Sesión de Stripe creada',
                        'checkout_url' => $session->url,
                        'order_id' => $order->id
                    ]);
                }
            }, 3); // 3 reintentos en deadlock
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Entregar productos del pedido al usuario.
     */
    private function fulfillOrder(Order $order)
    {
        $orderItems = $order->items()->with('purchasable')->get();

        foreach ($orderItems as $item) {
            $product = $item->purchasable;

            if ($product instanceof Card) {
                // Deduct stock from cards
                $product->decrement('stock', $item->quantity);

                // Añadir cartas al inventario
                $inventoryCard = InventoryCard::firstOrNew([
                    'user_id' => $order->user_id,
                    'card_id' => $product->id,
                    'condition' => 'NM',
                    'language' => 'en',
                    'is_foil' => false,
                ]);
                $inventoryCard->quantity = ($inventoryCard->quantity ?? 0) + $item->quantity;
                $inventoryCard->save();
            } elseif ($product instanceof BoosterPack) {
                // Añadir sobres al inventario (no tienen stock)
                $inventoryPack = InventoryPack::firstOrNew([
                    'user_id' => $order->user_id,
                    'booster_pack_id' => $product->id,
                ]);
                $inventoryPack->quantity = ($inventoryPack->quantity ?? 0) + $item->quantity;
                $inventoryPack->save();
            }
        }

        // Vaciar carrito del usuario
        $cart = Cart::where('user_id', $order->user_id)->first();
        if ($cart) {
            $cart->items()->delete();
            $cart->delete();
        }
    }
}
