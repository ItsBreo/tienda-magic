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
        // Recogemos los filtros de la URL
        $filters = $request->only(['search', 'type', 'sort']);

        // Consulta con filtros y paginación
        $packs = BoosterPack::with('cardSet')
            ->filter($filters)
            ->paginate(12)
            ->withQueryString();

        // Obtenemos lista de Sets y Tipos para rellenar los desplegables del filtro
        $sets = CardSet::select('id', 'name')->get();
        $types = BoosterPack::select('type')->distinct()->pluck('type');

        return Inertia::render('shop/Catalog', [
            'packs' => $packs,
            'filters' => $filters,
            'sets' => $sets,
            'types' => $types
        ]);
    }
}
