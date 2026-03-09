<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    /**
     * Ver el inventario del usuario autenticado
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        // 1. Paginamos y evitamos el N+1 cargando la expansión (set)
        $inventoryCards = InventoryCard::where('user_id', $user->id)
            ->with('card.set')
            ->paginate(24); // 24 es un buen número porque es múltiplo de 2, 3, 4 y 6 (ideal para grids)

        // 2. Calculamos los totales reales con SQL, no en memoria
        $totalCards = InventoryCard::where('user_id', $user->id)->sum('quantity');

        // 3. Devolvemos JSON puro para tu React
        return response()->json([
            'cards' => $inventoryCards,
            'stats' => [
                'total_cards' => $totalCards,
                // Puedes añadir total_packs aquí si también los paginas o cargas aparte
            ]
        ]);
    }
}
