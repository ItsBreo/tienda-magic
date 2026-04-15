<?php

namespace App\Http\Controllers\Market;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

class TransactionController extends Controller
{
    #[OA\Get(
        path: "/api/market/transactions",
        summary: "Historial del mercado",
        description: "Devuelve el historial de transacciones en el marketplace (stub).",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Historial obtenido exitosamente")]
    public function index()
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }
}
