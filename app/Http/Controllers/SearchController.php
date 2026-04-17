<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use OpenApi\Attributes as OA;

class SearchController extends Controller
{
    #[OA\Get(
        path: "/api/search/all",
        summary: "Búsqueda global",
        description: "Búsqueda unificada en toda la tienda y foro (stub).",
        tags: ["Search"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "q", in: "query", required: true, description: "Término de búsqueda", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Resultados de búsqueda")]
    public function searchAll(Request $request)
    {
        // TODO: implement search logic
        return response()->json(['message' => 'Not implemented yet'], 501);
    }
}
