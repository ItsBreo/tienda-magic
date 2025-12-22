<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\depositOrder;
use App\Models\walletTransaction;

class depositController extends Controller
{
    public function store(Request $request)
    {
        $request->validate(['amount' => 'required|numeric|min:5']);
        $user = Auth::user();
        $amount = $request->amount;

        // TODO: Simulamos respuesta exitosa de pasarela de pago (Bizum/PayPal)
        $paymentSuccess = true;
        $transactionRef = 'PAY-' . strtoupper(uniqid());

        if ($paymentSuccess) {
            DB::transaction(function () use ($user, $request, $transactionRef) {

                // Creamos registro de la recarga (Dinero Ficticio)
                $deposit = depositOrder::create([
                    'user_id' => $user->id,
                    'amount_eur' => $request->amount,
                    'payment_method' => 'credit_card',
                    'status' => 'COMPLETED',
                    'transaction_ref' => $transactionRef
                ]);

                // Sumamos saldo al usuario
                $user->increment('wallet_balance', $request->amount);

                // Creamos el registro de la transacción (Auditoría)
                walletTransaction::create([
                    'user_id' => $user->id,
                    'type' => 'DEPOSIT', // Tipo diferente a la compra
                    'amount' => $request->amount, // Positivo
                    'balance_after' => $user->fresh()->wallet_balance,
                    'description' => "Recarga ID: {$deposit->id}"
                ]);
            });

            return back()->with('success', 'Saldo recargado correctamente');
        }
    }
}
