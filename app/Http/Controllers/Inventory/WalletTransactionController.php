<?php

namespace App\Http\Controllers\Inventory;

use App\Http\Controllers\Controller;
use App\Models\WalletTransaction;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;

class WalletTransactionController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->paginate(15);

        return response()->json([
            'transactions' => $transactions
        ]);
    }

    public function downloadPdf()
    {
        $user = Auth::user();
        $transactions = WalletTransaction::where('user_id', $user->id)
            ->latest()
            ->get();

        $pdf = Pdf::loadView('pdf.wallet_transactions_pdf', compact('user', 'transactions'));

        return $pdf->download('historial_billetera_' . $user->username . '.pdf');
    }
}
