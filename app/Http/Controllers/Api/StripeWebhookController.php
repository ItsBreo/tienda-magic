<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
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

        try {
            $userId = $session->metadata->user_id;
            $amount = $session->metadata->amount; // Este amount ya está en euros desde el WalletController
            $stripeSessionId = $session->id;

            if (!$userId || !$amount) {
                Log::error('Missing metadata in checkout session', [
                    'session_id' => $stripeSessionId,
                    'metadata' => $session->metadata,
                ]);
                return response()->json(['error' => 'Missing metadata'], 400);
            }

            // El amount ya viene en euros desde el WalletController (no necesita conversión)
            $amountInEuros = (float) $amount;

            // Use database transaction to ensure data consistency
            DB::transaction(function () use ($userId, $amountInEuros, $stripeSessionId) {
                $user = User::findOrFail($userId);

                // Calculate new balance
                $currentBalance = $user->wallet_balance ?? 0;
                $newBalance = $currentBalance + $amountInEuros;

                // Update user balance
                $user->wallet_balance = $newBalance;
                $user->save();

                // Create transaction record
                DB::table('wallet_transaction')->insert([
                    'user_id' => $userId,
                    'type' => 'deposit',
                    'amount' => $amountInEuros,
                    'balance_after' => $newBalance,
                    'description' => "Recarga Stripe - Session: {$stripeSessionId}",
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                Log::info('Wallet recharge processed successfully', [
                    'user_id' => $userId,
                    'amount' => $amountInEuros,
                    'new_balance' => $newBalance,
                    'stripe_session_id' => $stripeSessionId,
                ]);
            });

            return response()->json(['status' => 'success']);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('User not found for wallet recharge', [
                'user_id' => $userId ?? 'unknown',
                'session_id' => $stripeSessionId ?? 'unknown',
            ]);
            return response()->json(['error' => 'User not found'], 404);
        } catch (\Exception $e) {
            Log::error('Error processing wallet recharge', [
                'error' => $e->getMessage(),
                'session_id' => $stripeSessionId ?? 'unknown',
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json(['error' => 'Processing failed'], 500);
        }
    }
}
