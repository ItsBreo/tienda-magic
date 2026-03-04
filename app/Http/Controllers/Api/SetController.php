<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Scryfall\ScryfallService;
use Illuminate\Http\JsonResponse;

class SetController extends Controller
{
    protected ScryfallService $scryfallService;

    public function __construct(ScryfallService $scryfallService)
    {
        $this->scryfallService = $scryfallService;
    }

    public function latest(): JsonResponse
    {
        return response()->json([
            'latestSet' => $this->scryfallService->getLatestSet()
        ]);
    }
}
