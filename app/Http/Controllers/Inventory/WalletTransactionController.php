<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Auth;

class WalletTransactionController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->get();

        return response()->json([
            'transactions' => $transactions
        ]);
    }
}
