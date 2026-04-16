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
use App\Models\WalletTransaction;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use OpenApi\Attributes as OA;
use Illuminate\Support\Facades\Log;

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

                // Validación de stock general
                foreach ($validated['items'] as $item) {
                    $model = $item['purchasable_type']::find($item['purchasable_id']);

                    if (!$model) {
                        throw new \Exception("Producto no encontrado: {$item['purchasable_type']} ID {$item['purchasable_id']}");
                    }

                    if (($model->stock ?? 0) < $item['quantity']) {
                        throw new \Exception("Stock insuficiente para '{$model->name}'. Stock disponible: {$model->stock}, solicitado: {$item['quantity']}");
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
                    $newBalance = $user->fresh()->wallet_balance;

                    // Registrar en el historial de la billetera
                    $itemCount = count($orderItems);
                    WalletTransaction::create([
                        'user_id'       => $user->id,
                        'type'          => 'purchase',
                        'amount'        => -$totalAmount,
                        'balance_after' => $newBalance,
                        'description'   => "Compra en la tienda — {$itemCount} " . ($itemCount === 1 ? 'artículo' : 'artículos'),
                    ]);

                    // Marcar como completado
                    $order->update([
                        'payment_status' => 'completed',
                        'status' => 'completed'
                    ]);

                    // Entregar productos y limpiar carrito
                    $order->fulfill();

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
                        'success_url' => config('app.url') . '/checkout/success?session_id={CHECKOUT_SESSION_ID}',
                        'cancel_url' => config('app.url') . '/checkout/cancel',
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
     * Verificar sesión de Stripe activamente (útil para dev local sin webhooks)
     */
    public function verifyStripeSession(Request $request)
    {
        $request->validate([
            'session_id' => 'required|string',
        ]);

        try {
            \Stripe\Stripe::setApiKey(config('services.stripe.secret'));
            $session = \Stripe\Checkout\Session::retrieve($request->session_id);

            if ($session->payment_status === 'paid') {
                $type = $session->metadata->type ?? 'order';
                
                if ($type === 'market') {
                    $marketListingId = $session->metadata->market_listing_id ?? null;
                    if ($marketListingId) {
                        $order = \App\Models\Order::where('stripe_session_id', $session->id)->first();
                        if ($order && $order->status !== 'completed') {
                            // Aquí llamamos la misma lógica manual para Market
                            $listing = \App\Models\MarketListing::find($marketListingId);
                            $buyer = $order->user;
                        if ($listing && $buyer) {
                            // Transferencia de Propiedad
                            if ($listing->listable_type === \App\Models\Card::class) {
                                $sellerItem = \App\Models\InventoryCard::findOrFail($listing->inventory_item_id);
                                $sellerItem->decrement('quantity');
                                $sellerItem->decrement('quantity_locked');

                                $buyerItem = \App\Models\InventoryCard::firstOrNew([
                                    'user_id' => $buyer->id,
                                    'card_id' => $listing->listable_id,
                                    'condition' => $sellerItem->condition,
                                    'language' => $sellerItem->language,
                                    'is_foil' => $sellerItem->is_foil,
                                ]);
                                $buyerItem->quantity = ($buyerItem->quantity ?? 0) + 1;
                                $buyerItem->save();
                            } else {
                                $sellerItem = \App\Models\InventoryPack::findOrFail($listing->inventory_item_id);
                                $sellerItem->decrement('quantity');
                                $sellerItem->decrement('quantity_locked');

                                $buyerItem = \App\Models\InventoryPack::firstOrNew([
                                    'user_id' => $buyer->id,
                                    'booster_pack_id' => $listing->listable_id,
                                ]);
                                $buyerItem->quantity = ($buyerItem->quantity ?? 0) + 1;
                                $buyerItem->save();
                            }

                            // Dinero al vendedor
                            $listing->seller->increment('wallet_balance', $listing->amount_to_seller);

                            // Cerrar Anuncio
                            $listing->update(['status' => 'sold', 'buyer_id' => $buyer->id]);

                            // Log
                            \App\Models\MarketTransaction::create([
                                'seller_id' => $listing->seller_id,
                                'buyer_id' => $buyer->id,
                                'sellable_id' => $listing->listable_id,
                                'sellable_type' => $listing->listable_type,
                                'price_total' => $listing->price_total,
                                'fee_platform' => $listing->fee_platform,
                                'amount_to_seller' => $listing->amount_to_seller,
                                'item_details' => [
                                    'name' => $listing->listable->name,
                                    'order_id' => $order->id
                                ]
                            ]);

                            $order->update(['payment_status' => 'completed', 'status' => 'completed']);
                            return response()->json(['success' => true, 'message' => 'Compra de mercado completada.']);
                        }
                    }
                    }
                } else {
                    $orderId = $session->metadata->order_id ?? null;
                    if ($orderId) {
                        $order = \App\Models\Order::find($orderId);
                        if ($order && $order->status !== 'completed') {
                            // Fulfillment manual activo para la tienda
                            $order->update([
                                'status' => 'completed',
                                'payment_status' => 'completed',
                                'payment_method' => 'stripe'
                            ]);
                            $order->fulfill();
                            return response()->json(['success' => true, 'message' => 'Orden completada y entregada.']);
                        }
                    }
                }
            }

            return response()->json(['success' => true, 'message' => 'Sesión verificada, estado: ' . $session->payment_status]);
        } catch (\Exception $e) {
            Log::error('Stripe Verify Error: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 400);
        }
    }
}
