<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\DepositOrder;
use App\Models\WalletTransaction;

class DepositController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:5']);
        $user = Auth::user();
        $amount = $request->amount;

        // TODO: Simulamos respuesta exitosa de pasarela de pago (Bizum/PayPal/Ebay)
        $paymentSuccess = true;
        $transactionRef = 'PAY-' . strtoupper(uniqid());

        if ($paymentSuccess) {
            DB::transaction(function () use ($user, $request, $transactionRef) {

                // Creamos registro de la recarga (Dinero Ficticio)
                $deposit = DepositOrder::create([
                    'user_id' => $user->id,
                    'amount_eur' => $request->amount,
                    'payment_method' => 'credit_card',
                    'status' => 'COMPLETED',
                    'transaction_ref' => $transactionRef
                ]);

                // Sumamos saldo al usuario
                $user->transactions->increment('wallet_balance', $request->amount);

                // Creamos el registro de la transacción (Auditoría)
                WalletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT',
                    'amount' => $request->amount,
                    'balance_after' => $user->refresh()->wallet_balance, //TODO: Revisar error method refresh/fresh/reload
                    'description' => "Recarga ID: {$deposit->id}"
                ]);
            });

            return back()->with('success', 'Saldo recargado correctamente');
        }
    }
}
