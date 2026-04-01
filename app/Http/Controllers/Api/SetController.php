<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Scryfall\ScryfallService;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class SetController extends Controller
{
    protected ScryfallService $scryfallService;

    public function __construct(ScryfallService $scryfallService)
    {
        $this->scryfallService = $scryfallService;
    }

    #[OA\Get(
        path: "/api/sets/latest",
        summary: "Obtener el último set (expansión)",
        description: "Devuelve la información del set de cartas más reciente.",
        tags: ["Sets"]
    )]
    #[OA\Response(
        response: 200,
        description: "Operación exitosa"
    )]
    public function latest(): JsonResponse
    {
        return response()->json([
            'latestSet' => $this->scryfallService->getLatestSet()
        ]);
    }
}
