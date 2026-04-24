<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Card;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminCardController extends Controller
{
    #[OA\Get(
        path: "/api/admin/cards",
        summary: "Lista de cartas Admin",
        description: "Obtiene una lista paginada de cartas (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de cartas")]
    public function index()
    {
        $cards = Card::with('cardSet')->latest()->paginate(20);
        return response()->json($cards);
    }

    #[OA\Post(
        path: "/api/admin/cards",
        summary: "Crear carta manual",
        description: "Añade una carta nueva manualmente (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "scryfall_id", type: "string"),
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "set_code", type: "string"),
            new OA\Property(property: "collector_number", type: "string"),
            new OA\Property(property: "rarity", type: "string"),
            new OA\Property(property: "price_eur", type: "number", nullable: true),
            new OA\Property(property: "price_usd", type: "number", nullable: true),
            new OA\Property(property: "mana_value", type: "integer"),
            new OA\Property(property: "image_uri", type: "string", format: "url", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Carta creada")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'scryfall_id' => 'required|string|unique:cards',
            'name' => 'required|string|max:255',
            'set_code' => 'required|string|exists:card_sets,code',
            'collector_number' => 'required|string',
            'rarity' => 'required|string',
            'price_eur' => 'nullable|numeric|min:0',
            'price_usd' => 'nullable|numeric|min:0',
            'mana_value' => 'required|numeric|min:0',
            'image_uri' => 'nullable|url'
        ]);

        $validated['card_set_id'] = strtolower($validated['set_code']);

        $card = Card::create($validated);

        return response()->json([
            'message' => 'Carta creada exitosamente',
            'card' => $card
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/cards/{cardId}",
        summary: "Actualizar carta manual",
        description: "Actualiza los datos de una carta existente.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "cardId", in: "path", required: true, description: "ID de carta", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "price_eur", type: "number", nullable: true),
            new OA\Property(property: "rarity", type: "string"),
            new OA\Property(property: "image_uri", type: "string", format: "url", nullable: true),
            new OA\Property(property: "is_active", type: "boolean")
        ])
    )]
    #[OA\Response(response: 200, description: "Carta actualizada")]
    public function update(Request $request, Card $card)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'rarity' => 'sometimes|required|string',
            'price_eur' => 'nullable|numeric|min:0',
            'price_usd' => 'nullable|numeric|min:0',
            'image_uri' => 'nullable|url',
            'is_active' => 'sometimes|boolean'
        ]);

        $card->update($validated);

        return response()->json([
            'message' => 'Carta actualizada exitosamente',
            'card' => $card
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/cards/{cardId}",
        summary: "Eliminar carta manual",
        description: "Elimina una carta manualmente.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "cardId", in: "path", required: true, description: "ID de carta", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Carta eliminada")]
    public function destroy(Card $card)
    {
        // Soft Delete (exilio)
        $card->delete();
        return response()->json(['message' => 'Carta exiliada exitosamente.']);
    }

    public function restore(Card $card)
    {
        // Validar que la carta esté exiliada (soft deleted)
        if (!$card->trashed()) {
            return response()->json(['message' => 'Solo se puede restaurar cartas que han sido exiliadas.'], 403);
        }

        // Restore (restaurar soft delete)
        $card->restore();

        return response()->json(['message' => 'Carta restaurada exitosamente.']);
    }

    public function forceDelete(Card $card)
    {
        // Validar que la carta ya esté exiliada (soft deleted)
        if (!$card->trashed()) {
            return response()->json(['message' => 'Solo se puede eliminar definitivamente cartas que ya han sido exiliadas.'], 403);
        }

        // Force Delete (borrado físico)
        $card->forceDelete();

        return response()->json(['message' => 'Carta eliminada permanentemente.']);
    }

    /**
     * Acciones Masivas (Bulk Actions)
     */

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:cards,id'
        ]);

        Card::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'message' => count($validated['ids']) . ' cartas eliminadas correctamente.'
        ]);
    }

    public function bulkToggleActive(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:cards,id',
            'is_active' => 'required|boolean'
        ]);

        Card::whereIn('id', $validated['ids'])->update(['is_active' => $validated['is_active']]);

        return response()->json([
            'message' => 'Estado de ' . count($validated['ids']) . ' cartas actualizado.'
        ]);
    }
}
