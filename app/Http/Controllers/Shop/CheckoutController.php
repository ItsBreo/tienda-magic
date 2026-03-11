<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
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
            // Validar que el pack aún existe y obtener precio actual
            $pack = BoosterPack::find($item->booster_pack_id);
            if (!$pack) {
                // Eliminar items huérfanos y continuar
                $item->delete();
                continue;
            }

            $itemTotal = $pack->price * $item->quantity;
            $subtotal += $itemTotal;

            $validItems[] = [
                'id' => $item->id,
                'booster_pack_id' => $item->booster_pack_id,
                'quantity' => $item->quantity,
                'unit_price' => $pack->price,
                'total_price' => $itemTotal,
                'booster_pack' => $item->boosterPack
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
                    $pack = BoosterPack::lockForUpdate()->find($item->booster_pack_id);
                    if (!$pack) {
                        // Eliminar items huérfanos
                        $item->delete();
                        continue;
                    }

                    // Validación adicional de integridad de precios
                    if ($pack->price <= 0) {
                        throw new \Exception('Precio inválido detectado para pack ID: ' . $pack->id);
                    }

                    $itemTotal = $pack->price * $item->quantity;
                    $subtotal += $itemTotal;

                    $validItems[] = [
                        'booster_pack_id' => $item->booster_pack_id,
                        'quantity' => $item->quantity,
                        'unit_price' => $pack->price,
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

                // Validación anti-fraude: límite de compra
                if ($total > 1000) {
                    return response()->json([
                        'message' => 'El monto de la compra excede el límite permitido'
                    ], 400);
                }

                // Procesar pago según método
                if ($paymentMethod === 'wallet') {
                    // Descontar fondos del wallet
                    $user->wallet_balance -= $total;
                    $user->save();
                }
                // Aquí se integraría Stripe para pago con tarjeta

                // Crear orden
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
