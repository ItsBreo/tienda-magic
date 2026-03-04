<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    /**
     * Devuelve solo las estadísticas locales de la base de datos de la tienda.
     */
    public function getStats(): JsonResponse
    {
        return response()->json([
            'totalPacks' => 420, // Dato mockup
            'activeUsers' => User::count(), // Dato real de tu base de datos
            'todaySales' => 15, // Dato mockup
        ]);
    }
}
