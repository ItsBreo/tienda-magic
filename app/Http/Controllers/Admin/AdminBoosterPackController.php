<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BoosterPack;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminBoosterPackController extends Controller
{
    #[OA\Get(
        path: "/api/admin/booster-packs",
        summary: "Lista de sobres Admin",
        description: "Obtiene una lista de todos los sobres (activos e inactivos) para administración.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de sobres")]
    public function index()
    {
        // Usamos query bypass para traer todos, ignorando el scope por defecto de activos si fuera global,
        // pero como es un scopeFilter manual, simplemente no pasamos filtros restrictivos.
        $packs = BoosterPack::with('cardSet')->latest()->get();
        return response()->json($packs);
    }

    #[OA\Post(
        path: "/api/admin/booster-packs",
        summary: "Crear sobre nuevo",
        description: "Crea un nuevo sobre de cartas.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "price", type: "number"),
            new OA\Property(property: "card_set_id", type: "string"),
            new OA\Property(property: "type", type: "string"),
            new OA\Property(property: "image_uri", type: "string", nullable: true),
            new OA\Property(property: "is_active", type: "boolean")
        ])
    )]
    #[OA\Response(response: 201, description: "Sobre creado")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'card_set_id' => 'required|string|exists:card_sets,code',
            'type' => 'required|string',
            'image_uri' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $pack = BoosterPack::create($validated);

        return response()->json([
            'message' => 'Sobre creado exitosamente',
            'booster_pack' => $pack
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/booster-packs/{id}",
        summary: "Actualizar sobre",
        description: "Actualiza los detalles de un sobre existente, incluido su estado activo.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Sobre actualizado")]
    public function update(Request $request, $id)
    {
        $pack = BoosterPack::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'card_set_id' => 'sometimes|required|string|exists:card_sets,code',
            'type' => 'sometimes|required|string',
            'image_uri' => 'nullable|string',
            'is_active' => 'boolean'
        ]);

        $pack->update($validated);

        return response()->json([
            'message' => 'Sobre actualizado exitosamente',
            'booster_pack' => $pack
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/booster-packs/{id}",
        summary: "Eliminar sobre",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Sobre eliminado")]
    public function destroy($id)
    {
        $pack = BoosterPack::findOrFail($id);
        
        // Podríamos comprobar si hay órdenes asociadas antes de borrar
        $pack->delete();

        return response()->json(['message' => 'Sobre eliminado exitosamente']);
    }
}
