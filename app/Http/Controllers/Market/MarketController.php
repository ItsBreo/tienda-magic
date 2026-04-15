<?php

namespace App\Http\Controllers\Market;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

class MarketController extends Controller
{
    #[OA\Get(
        path: "/api/market",
        summary: "Ver mercado",
        description: "Lista las cartas puestas a la venta en el marketplace (stub).",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Listado del mercado")]
    public function index()
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    #[OA\Post(
        path: "/api/market/cards",
        summary: "Publicar carta en mercado",
        description: "Pone a la venta una carta del inventario del usuario (stub).",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 201, description: "Carta publicada en el mercado")]
    public function createListing(Request $request)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    #[OA\Post(
        path: "/api/market/cards/{id}/buy",
        summary: "Comprar carta",
        description: "Compra una carta que está listada en el mercado (stub).",
        tags: ["Market"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID del listado/carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Compra exitosa")]
    public function buyCard(Request $request, $id)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }
}
