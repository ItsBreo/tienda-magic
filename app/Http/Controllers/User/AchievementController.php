<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AchievementController extends Controller
{
    /**
     * Lista los logros conseguidos por el usuario autenticado.
     */
    #[OA\Get(
        path: "/api/achievements",
        summary: "Mis logros",
        description: "Obtiene la lista de logros desbloqueados por el usuario actual.",
        tags: ["Achievements"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Logros obtenidos exitosamente")]
    public function index(Request $request)
    {
        $user = $request->user();

        // Cargamos los logros con la fecha de obtención desde la tabla pivote
        $achievements = $user->achievements()
            ->select('achievements.slug', 'achievements.name', 'achievements.description', 'achievements.badge_icon', 'achievements.xp_points')
            ->get()
            ->map(function ($achievement) {
                return [
                    'slug'        => $achievement->slug,
                    'name'        => $achievement->name,
                    'description' => $achievement->description,
                    'badge_icon'  => $achievement->badge_icon,
                    'xp_points'   => $achievement->xp_points,
                    'obtained_at' => $achievement->pivot->obtained_at,
                ];
            });

        return response()->json([
            'achievements' => $achievements
        ]);
    }
}
