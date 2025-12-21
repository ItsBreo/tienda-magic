<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\walletTransaction;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class walletTransactionController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Obtenemos historial de transacciones ordenado
        $transactions = walletTransaction::where('user_id', $user->id)
            ->latest()
            ->get();

        return Inertia::render('Inventory/WalletHistory', [
            'transactions' => $transactions
        ]);
    }
}
