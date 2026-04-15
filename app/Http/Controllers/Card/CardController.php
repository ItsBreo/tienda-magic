<?php

namespace App\Http\Controllers\Card;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Card;
use OpenApi\Attributes as OA;

class CardController extends Controller
{
    #[OA\Get(
        path: "/api/cards",
        summary: "Obtener todas las cartas",
        description: "Lista todas las cartas disponibles con información de su set.",
        tags: ["Cards"]
    )]
    #[OA\Response(response: 200, description: "Catálogo de cartas")]
    public function index()
    {
        $cards = Card::with('cardSet')->get();
        return response()->json($cards);
    }

    #[OA\Get(
        path: "/api/cards/{id}",
        summary: "Detalle de una carta",
        description: "Devuelve los detalles de una carta específica (stub).",
        tags: ["Cards"]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Carta encontrada")]
    public function show($id)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    #[OA\Post(
        path: "/api/cards/{id}/favorite",
        summary: "Añadir a favoritos",
        description: "Añade una carta a los favoritos del usuario autenticado (stub).",
        tags: ["Cards"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Carta añadida a favoritos")]
    public function addToFavorites($id)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }

    #[OA\Delete(
        path: "/api/cards/{id}/favorite",
        summary: "Quitar de favoritos",
        description: "Quita una carta de los favoritos del usuario (stub).",
        tags: ["Cards"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Carta quitada de favoritos")]
    public function removeFromFavorites($id)
    {
        // TODO: implement
        return response()->json(['message' => 'Not implemented yet'], 501);
    }
}
