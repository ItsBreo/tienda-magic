<?php

namespace App\Http\Controllers\Shop;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\boosterPack;
use App\Models\cardSet;

class catalogController extends Controller
{
    public function index(Request $request)
    {
        // Recogemos los filtros de la URL
        $filters = $request->only(['search', 'type', 'sort']);

        // Consulta con filtros y paginación
        $packs = boosterPack::with('cardSet')
            ->filter($filters)
            ->paginate(12)
            ->withQueryString();

        // Obtenemos lista de Sets y Tipos para rellenar los desplegables del filtro
        $sets = cardSet::select('id', 'name')->get();
        $types = boosterPack::select('type')->distinct()->pluck('type');

        return Inertia::render('Shop/Catalog', [
            'packs' => $packs,
            'filters' => $filters,
            'sets' => $sets,
            'types' => $types
        ]);
    }
}
