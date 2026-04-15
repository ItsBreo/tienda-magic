<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use App\Models\BoosterPack;
use App\Models\Card;
use OpenApi\Attributes as OA;

class PackDetailController extends Controller
{
    #[OA\Get(
        path: "/api/pack/{code}",
        summary: "Detalle de Pack por código/ID",
        description: "Obtiene los detalles de un pack, relacionados y cartas posibles (chase cards).",
        tags: ["Shop"]
    )]
    #[OA\Parameter(name: "code", in: "path", required: true, description: "Código o ID del pack", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Detalle completo del pack y contenido posible")]
    #[OA\Response(response: 404, description: "Pack no encontrado")]
    public function show($id)
    {
        $pack = BoosterPack::with('cardSet')
            ->findOrFail($id);

        // Buscar packs del mismo set
        $relatedPacks = BoosterPack::with('cardSet')
            ->where('card_set_id', $pack->card_set_id)
            ->where('id', '!=', $pack->id)
            ->take(6)
            ->get();

        // Buscar cartas del set ordenadas por rareza (seguro contra SQL injection)
        $rarityOrder = "CASE rarity
            WHEN 'mythic' THEN 1
            WHEN 'rare' THEN 2
            WHEN 'uncommon' THEN 3
            WHEN 'common' THEN 4
            ELSE 5
        END";

        $possibleCards = Card::where('set_code', $pack->card_set_id)
            ->orderByRaw($rarityOrder)
            ->orderBy('id', 'asc')
            ->take(20)
            ->get();

        // Buscar cartas con imagen para mostrar
        $chaseCards = Card::where('set_code', $pack->card_set_id)
            ->whereNotNull('image_uri')
            ->select('id', 'name', 'rarity', 'image_uri')
            ->orderBy('rarity', 'desc')
            ->orderBy('id', 'asc')
            ->limit(10)
            ->get();

        // Si no hay cartas con imagen, buscar de cualquier set
        if ($chaseCards->isEmpty()) {
            $chaseCards = Card::whereNotNull('image_uri')
                ->select('id', 'name', 'rarity', 'image_uri')
                ->orderBy('rarity', 'desc')
                ->orderBy('id', 'asc')
                ->limit(10)
                ->get();
        }

        return response()->json([
            'data' => [
                'pack' => $pack,
                'relatedPacks' => $relatedPacks,
                'possibleCards' => $possibleCards,
                'chaseCards' => $chaseCards,
            ]
        ]);
    }
}
