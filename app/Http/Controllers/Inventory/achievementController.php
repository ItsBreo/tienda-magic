<?php

namespace App\Http\Controllers\Inventory;

use App\Models\Achievement;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class AchievementController extends Controller
{
    // Mostrar logros de usuario
    public function index()
    {
        $user = auth()->user();
        $achievements = $user->achievements; // Asumiendo que tienes una relación definida en el modelo User

        return response()->json([
            'message' => 'Logros obtenidos correctamente',
            'achievements' => $achievements
        ]);
    }

    // Otorgar el logro al usuario (esto se llamaría desde otros controladores cuando se cumplan las condiciones)
    public function grantAchievement($achievementId)
    {
        $user = auth()->user();
        $achievement = Achievement::find($achievementId);

        if (!$achievement) {
            return response()->json([
                'error' => 'Logro no encontrado'
            ], 404);
        }

        // Verificar si el usuario ya tiene el logro
        if ($user->achievements()->where('achievement_id', $achievementId)->exists()) {
            return response()->json([
                'message' => 'El usuario ya tiene este logro'
            ], 200);
        }

        // Otorgar el logro al usuario
        $user->achievements()->attach($achievementId);

        return response()->json([
            'message' => 'Logro otorgado correctamente',
            'achievement' => $achievement
        ]);
    }

    // Otorgar un logro por nombre
    public function grantAchievementByName(Request $request)
    {
        $request->validate([
            'achievement_name' => 'required|string'
        ]);

        $user = auth()->user();
        $achievement = Achievement::where('name', $request->achievement_name)
            ->firstOrCreate(
                ['name' => $request->achievement_name],
                ['description' => 'Logro: ' . $request->achievement_name]
            );

        // Verificar si el usuario ya tiene el logro
        if ($user->achievements()->where('achievement_id', $achievement->id)->exists()) {
            return response()->json([
                'message' => 'El usuario ya tiene este logro'
            ], 200);
        }

        $user->achievements()->attach($achievement->id);

        return response()->json([
            'message' => 'Logro otorgado correctamente',
            'achievement' => $achievement
        ]);
    }
}
