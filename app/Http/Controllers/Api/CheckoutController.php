<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Models\Cart;
use App\Models\WalletTransaction;
use App\Models\InventoryPack;
use App\Models\InventoryCard;

class CheckoutController extends Controller
{
    /**
     * Procesar el checkout de manera transaccional y segura.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function process(Request $request)
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = User::where('id', $request->user()->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $cart = Cart::with(['items.boosterPack', 'items.card'])
                    ->where('user_id', $user->id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $totalAmount = 0;
                $validationErrors = [];

                foreach ($cart->items as $item) {
                    $itemTotal = 0;

                    if ($item->booster_pack_id) {
                        $boosterPack = $item->boosterPack;
                        $itemTotal = $boosterPack->price * $item->quantity;
                        $totalAmount += $itemTotal;

                        if ($boosterPack->stock < $item->quantity) {
                            $validationErrors[] = "Stock insuficiente para pack: {$boosterPack->name} (Disponible: {$boosterPack->stock}, Solicitado: {$item->quantity})";
                        }
                    } elseif ($item->card_id) {
                        $card = $item->card;
                        $itemTotal = ($card->market_avg_price > 0 ? $card->market_avg_price : 1.50) * $item->quantity;
                        $totalAmount += $itemTotal;

                        if ($card->stock < $item->quantity) {
                            $validationErrors[] = "Stock insuficiente para carta: {$card->name} (Disponible: {$card->stock}, Solicitado: {$item->quantity})";
                        }
                    }
                }

                if ($user->wallet_balance < $totalAmount) {
                    $validationErrors[] = "Saldo insuficiente (Disponible: €{$user->wallet_balance}, Requerido: €{$totalAmount})";
                }

                if (!empty($validationErrors)) {
                    throw new \Exception(implode('; ', $validationErrors));
                }

                $user->decrement('wallet_balance', $totalAmount);
                $newBalance = $user->fresh()->wallet_balance;

                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'PURCHASE_PACK',
                    'amount' => -$totalAmount,
                    'balance_after' => $newBalance,
                    'description' => 'Compra de sobres en tienda',
                ]);

                foreach ($cart->items as $item) {
                    if ($item->booster_pack_id) {
                        $boosterPack = $item->boosterPack;
                        $boosterPack->decrement('stock', $item->quantity);

                        $invPack = InventoryPack::firstOrNew([
                            'user_id' => $user->id,
                            'booster_pack_id' => $boosterPack->id,
                        ]);
                        $invPack->quantity = ($invPack->quantity ?? 0) + $item->quantity;
                        $invPack->save();
                    } elseif ($item->card_id) {
                        $card = $item->card;
                        $card->decrement('stock', $item->quantity);

                        for ($i = 0; $i < $item->quantity; $i++) {
                            $invCard = InventoryCard::firstOrNew([
                                'user_id' => $user->id,
                                'card_id' => $card->id,
                                'condition' => 'NM',
                                'language' => 'en',
                                'is_foil' => false,
                            ]);
                            $invCard->quantity = ($invCard->quantity ?? 0) + 1;
                            $invCard->save();
                        }
                    }
                }

                $cart->items()->delete();
                $cart->delete();

                return response()->json([
                    'success' => true,
                    'message' => 'Checkout procesado exitosamente',
                    'total_amount' => $totalAmount,
                    'remaining_balance' => $newBalance,
                ]);

            }, 3);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }
}
