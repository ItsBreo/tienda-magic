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
            } elseif ($type === 'market') {
                return $this->handleMarketPayment($session);
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
            $order->fulfill();

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
     * Procesar pago de marketplace (P2P).
     */
    private function handleMarketPayment($session)
    {
        $orderId = $session->metadata->order_id ?? null;
        $listingId = $session->metadata->market_listing_id ?? null;
        $stripeSessionId = $session->id;

        Log::info('Processing market payment webhook', [
            'order_id' => $orderId,
            'listing_id' => $listingId,
            'session_id' => $stripeSessionId
        ]);

        if (!$orderId || !$listingId) {
            Log::error('Missing metadata in market payment session', [
                'session_id' => $stripeSessionId,
                'metadata' => $session->metadata,
            ]);
            return response()->json(['error' => 'Missing metadata'], 400);
        }

        try {
            return DB::transaction(function () use ($orderId, $listingId, $stripeSessionId) {
                // 1. Cargar datos necesarios con bloqueo
                $order = Order::lockForUpdate()->find($orderId);
                if (!$order) {
                    Log::error('Order not found for market payment', ['order_id' => $orderId]);
                    return response()->json(['error' => 'Order not found'], 404);
                }

                $listing = \App\Models\MarketListing::with('seller')->lockForUpdate()->find($listingId);
                if (!$listing) {
                    Log::error('Market listing not found', ['listing_id' => $listingId]);
                    return response()->json(['error' => 'Listing not found'], 404);
                }

                $buyer = User::findOrFail($order->user_id);
                $seller = $listing->seller;

                if (!$seller) {
                    Log::error('Seller not found for listing', ['listing_id' => $listingId]);
                    return response()->json(['error' => 'Seller not found'], 404);
                }

                // 2. Pago al vendedor
                $seller->increment('wallet_balance', (float) $listing->amount_to_seller);

                // 3. Transferencia de Propiedad
                if ($listing->listable_type === Card::class || str_contains($listing->listable_type, 'Card')) {
                    $sellerItem = \App\Models\InventoryCard::findOrFail($listing->inventory_item_id);
                    $sellerItem->decrement('quantity');
                    if ($sellerItem->quantity_locked > 0) {
                        $sellerItem->decrement('quantity_locked');
                    }

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
                    if ($sellerItem->quantity_locked > 0) {
                        $sellerItem->decrement('quantity_locked');
                    }

                    $buyerItem = \App\Models\InventoryPack::firstOrNew([
                        'user_id' => $buyer->id,
                        'booster_pack_id' => $listing->listable_id,
                    ]);
                    $buyerItem->quantity = ($buyerItem->quantity ?? 0) + 1;
                    $buyerItem->save();
                }

                // 4. Actualizar Estado
                $listing->update(['status' => 'sold', 'buyer_id' => $buyer->id]);

                $order->update([
                    'payment_status' => 'completed',
                    'status' => 'completed',
                    'stripe_session_id' => $stripeSessionId
                ]);

                // 5. Registrar Transacción
                \App\Models\MarketTransaction::create([
                    'order_id' => $order->id,
                    'market_listing_id' => $listing->id,
                    'seller_id' => $seller->id,
                    'buyer_id' => $buyer->id,
                    'price_total' => (float) $listing->price_total,
                    'fee_platform' => (float) $listing->fee_platform,
                    'amount_to_seller' => (float) $listing->amount_to_seller,
                    'status' => 'completed'
                ]);

                return response()->json(['status' => 'success']);
            });
        } catch (\Exception $e) {
            Log::error('Critical error in handleMarketPayment', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
