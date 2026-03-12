<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\BoosterPack;
use App\Models\CardSet;

class CatalogController extends Controller
{
    /**
     * Display shop catalog with filtered booster packs and metadata.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Obtain filters from request
        $filters = $request->only(['search', 'type', 'sort']);

        // Query booster packs with applied filters and pagination
        // El cover_image se generará automáticamente via el accessor del modelo
        $packs = BoosterPack::with('cardSet')
            ->filter($filters)
            ->paginate(6)
            ->withQueryString();

        // List of sets and types for filter dropdowns
        $sets = CardSet::select('code', 'name')->get();
        $types = BoosterPack::select('type')->distinct()->pluck('type');

        return response()->json([
            'data' => [
                'packs' => $packs,
                'filters' => $filters,
                'sets' => $sets,
                'types' => $types,
            ]
        ]);
    }
}
