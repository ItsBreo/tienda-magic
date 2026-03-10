<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\DepositOrder;
use App\Models\WalletTransaction;
use App\Models\User;

class DepositController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:5']);
        /**
        * PHPDoc to detect methods from eloquent user auth
        * @var \App\Models\User $user
        **/
        $user = Auth::user();
        $amount = (float)$request->amount;

        // TODO: Simulamos respuesta exitosa de pasarela de pago (Bizum/PayPal/Ebay)
        $transactionRef = 'PAY-' . strtoupper(uniqid());

        try {
            DB::transaction(function () use ($user, $amount, $transactionRef) {

                $deposit = DepositOrder::create([
                    'user_id' => $user->id,
                    'amount_eur' => $amount,
                    'payment_method' => 'credit_card',
                    'status' => 'COMPLETED',
                    'transaction_ref' => $transactionRef
                ]);

                $user->increment('wallet_balance', $amount);

                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT',
                    'amount' => $amount,
                    'balance_after' => $user->fresh()->wallet_balance,
                    'description' => "Recarga ID: {$deposit->id}"
                ]);
            });

            return response()->json(['message' => 'Depósito realizado con éxito!'], 200);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
