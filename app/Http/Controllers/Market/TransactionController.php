<?php

namespace App\Http\Controllers\Market;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

use App\Models\MarketTransaction;

class TransactionController extends Controller
{
    /**
     * Historial público de transacciones del mercado.
     */
    #[OA\Get(
        path: "/api/market/transactions",
        summary: "Historial del mercado",
        description: "Devuelve el historial de transacciones en el marketplace.",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Historial obtenido exitosamente")]
    public function index()
    {
        $transactions = MarketTransaction::with(['seller', 'buyer'])
            ->latest()
            ->paginate(30);

        return response()->json($transactions);
    }

    /**
     * Mis transacciones (como comprador o vendedor).
     */
    public function myTransactions()
    {
        $userId = auth()->id();

        $transactions = MarketTransaction::with(['seller', 'buyer'])
            ->where('seller_id', $userId)
            ->orWhere('buyer_id', $userId)
            ->latest()
            ->paginate(20);

        return response()->json($transactions);
    }
}
