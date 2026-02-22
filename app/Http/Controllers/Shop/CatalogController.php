<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\BoosterPack;
use App\Models\CardSet;

class CatalogController extends Controller
{
    public function index(Request $request)
    {
        // Obtain filters from request
        $filters = $request->only(['search', 'type', 'sort']);

        // Query booster packs with applied filters and pagination
        $packs = BoosterPack::with('cardSet')
            ->filter($filters)
            ->paginate(12)
            ->withQueryString();

        // List of sets and types for filter dropdowns
        $sets = CardSet::select('code', 'name')->get();
        $types = BoosterPack::select('type')->distinct()->pluck('type');

        return Inertia::render('Shop/Catalog', [
            'packs' => $packs,
            'filters' => $filters,
            'sets' => $sets,
            'types' => $types
        ]);
    }
}
