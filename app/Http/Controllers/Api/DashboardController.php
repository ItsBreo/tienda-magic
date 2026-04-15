<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

class DashboardController extends Controller
{
    #[OA\Get(
        path: "/api/store-stats",
        summary: "Estadísticas del panel",
        description: "Devuelve estadísticas globales de la DB de la tienda.",
        tags: ["Dashboard"]
    )]
    #[OA\Response(response: 200, description: "Datos estadísticos")]
    public function getStats(): JsonResponse
    {
        return response()->json([
            'totalPacks' => 420, // Dato mockup
            'activeUsers' => User::count(), // Dato real de tu base de datos
            'todaySales' => 15, // Dato mockup
        ]);
    }
}
