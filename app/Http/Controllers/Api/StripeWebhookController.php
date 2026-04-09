<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Order;
use App\Models\Card;
use App\Models\BoosterPack;
use App\Models\InventoryCard;
use App\Models\InventoryPack;
use App\Models\Cart;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Webhook;
use Stripe\Exception\SignatureVerificationException;

class StripeWebhookController extends Controller
{
    /**
     * Handle incoming Stripe webhook requests.
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');
        $webhookSecret = config('services.stripe.webhook_secret');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, $webhookSecret);
        } catch (SignatureVerificationException $e) {
            Log::error('Webhook signature verification failed', [
                'error' => $e->getMessage(),
                'signature' => $sigHeader,
            ]);
            return response()->json(['error' => 'Invalid signature'], 403);
        } catch (\UnexpectedValueException $e) {
            Log::error('Invalid webhook payload', [
                'error' => $e->getMessage(),
            ]);
            return response()->json(['error' => 'Invalid payload'], 400);
        }

        // Handle the specific event type
        if ($event->type === 'checkout.session.completed') {
            return $this->handleCheckoutSessionCompleted($event);
        }

        // Return 200 for other events we don't handle
        return response()->json(['status' => 'ignored']);
    }

    /**
     * Handle checkout.session.completed event.
     */
    private function handleCheckoutSessionCompleted($event)
    {
        $session = $event->data->object;
        $type = $session->metadata->type ?? 'recharge'; // Default antiguo

        try {
            if ($type === 'order') {
                return $this->handleOrderPayment($session);
            } else {
                // Flujo recarga (default)
                return $this->handleWalletRecharge($session);
            }
        } catch (\Exception $e) {
            Log::error('Error processing checkout session', [
                'error' => $e->getMessage(),
                'session_id' => $session->id,
                'type' => $type,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }

    /**
     * Procesar pago de pedido (nuevo flujo).
     */
    private function handleOrderPayment($session)
    {
        $orderId = $session->metadata->order_id;
        $stripeSessionId = $session->id;

        if (!$orderId) {
            Log::error('Missing order_id in order metadata', [
                'session_id' => $stripeSessionId,
                'metadata' => $session->metadata,
            ]);
            return response()->json(['error' => 'Missing order_id'], 400);
        }

        return DB::transaction(function () use ($orderId, $stripeSessionId) {
            $order = Order::lockForUpdate()->find($orderId);

            if (!$order) {
                throw new \Exception("Order {$orderId} not found");
            }

            // Marcar como completado
            $order->update([
                'payment_status' => 'completed',
                'status' => 'completed',
                'stripe_session_id' => $stripeSessionId
            ]);

            // Entregar productos y limpiar carrito
            $this->fulfillOrder($order);

            Log::info('Order payment completed', [
                'order_id' => $orderId,
                'stripe_session_id' => $stripeSessionId,
                'total_amount' => $order->total_amount
            ]);

            return response()->json(['status' => 'success']);
        });
    }

    /**
     * Procesar recarga de wallet (flujo antiguo).
     */
    private function handleWalletRecharge($session)
    {
        $userId = $session->metadata->user_id;
        $amount = $session->metadata->amount;
        $stripeSessionId = $session->id;

        if (!$userId || !$amount) {
            Log::error('Missing metadata in recharge session', [
                'session_id' => $stripeSessionId,
                'metadata' => $session->metadata,
            ]);
            return response()->json(['error' => 'Missing metadata'], 400);
        }

        $amountInEuros = (float) $amount;

        DB::transaction(function () use ($userId, $amountInEuros, $stripeSessionId) {
            $user = User::findOrFail($userId);

            $currentBalance = $user->wallet_balance ?? 0;
            $newBalance = $currentBalance + $amountInEuros;

            $user->wallet_balance = $newBalance;
            $user->save();

            // Crear transacción
            DB::table('wallet_transaction')->insert([
                'user_id' => $userId,
                'type' => 'deposit',
                'amount' => $amountInEuros,
                'balance_after' => $newBalance,
                'description' => "Recarga Stripe - Session: {$stripeSessionId}",
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('Wallet recharge processed', [
                'user_id' => $userId,
                'amount' => $amountInEuros,
                'new_balance' => $newBalance,
                'stripe_session_id' => $stripeSessionId,
            ]);
        });

        return response()->json(['status' => 'success']);
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
