<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CardSet;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminSetController extends Controller
{
    #[OA\Get(
        path: "/api/admin/sets",
        summary: "Lista de sets Admin",
        description: "Obtiene una lista paginada de expansiones de cartas (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de sets")]
    public function index()
    {
        $sets = CardSet::latest('released_at')->paginate(20);
        return response()->json($sets);
    }

    #[OA\Post(
        path: "/api/admin/sets",
        summary: "Crear set",
        description: "Crea una expansión de forma manual (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "code", type: "string"),
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "released_at", type: "string", format: "date", nullable: true),
            new OA\Property(property: "card_count", type: "integer"),
            new OA\Property(property: "icon_svg_uri", type: "string", format: "url", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Set creado")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:10|unique:card_sets',
            'name' => 'required|string|max:255',
            'released_at' => 'nullable|date',
            'card_count' => 'required|integer|min:0',
            'icon_svg_uri' => 'nullable|url',
        ]);

        $set = CardSet::create($validated);

        return response()->json([
            'message' => 'Set creado exitosamente',
            'set' => $set
        ], 201);
    }

    #[OA\Delete(
        path: "/api/admin/sets/{code}",
        summary: "Eliminar set",
        description: "Elimina una expansión (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "code", in: "path", required: true, description: "Código del set", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Set eliminado")]
    public function destroy($code)
    {
        $set = CardSet::findOrFail($code);
        $set->delete();

        return response()->json(['message' => 'Set eliminado exitosamente.']);
    }
}
