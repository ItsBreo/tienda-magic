<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\userProfile;
use App\Models\User;
use Illuminate\Http\Request;

class UserProfileController extends Controller
{
    /**
     * Obtener el perfil del usuario autenticado
     */
    public function showProfile()
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        return response()->json([
            'message' => 'Perfil obtenido correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Obtener el perfil de un usuario específico
     */
    public function show($userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'error' => 'Usuario no encontrado'
            ], 404);
        }

        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        return response()->json([
            'message' => 'Perfil obtenido correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Crear el perfil para el usuario autenticado
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        // Verificar si ya tiene perfil
        if ($user->profile) {
            return response()->json([
                'error' => 'El usuario ya tiene un perfil'
            ], 400);
        }

        // Validar datos
        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'avatar_url' => 'nullable|url',
            'banner_url' => 'nullable|url',
            'bio' => 'nullable|string|max:500',
            'country' => 'nullable|string|max:100',
            'trade_terms' => 'nullable|string|max:500',
        ]);

        // Crear perfil
        $profile = userProfile::create($validated);
        $profile->user_id = $user->id;
        $profile->reputation_score = 0;
        $profile->save();

        return response()->json([
            'message' => 'Perfil creado correctamente',
            'profile' => $profile
        ], 201);
    }

    /**
     * Actualizar el perfil del usuario autenticado
     */
    public function update(Request $request)
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        // Validar datos
        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:255',
            'avatar_url' => 'sometimes|nullable|url',
            'banner_url' => 'sometimes|nullable|url',
            'bio' => 'sometimes|nullable|string|max:500',
            'country' => 'sometimes|nullable|string|max:100',
            'trade_terms' => 'sometimes|nullable|string|max:500',
        ]);

        // Actualizar perfil
        $profile->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Actualizar solo información pública del perfil
     */
    public function updatePublicInfo(Request $request)
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        // Validar datos públicos
        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:255',
            'avatar_url' => 'sometimes|nullable|url',
            'banner_url' => 'sometimes|nullable|url',
            'bio' => 'sometimes|nullable|string|max:500',
            'country' => 'sometimes|nullable|string|max:100',
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Información pública actualizada correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Actualizar reputación del usuario (solo administrador)
     */
    public function updateReputation(Request $request, $userId)
    {
        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'error' => 'Usuario no encontrado'
            ], 404);
        }

        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        $validated = $request->validate([
            'reputation_score' => 'required|integer'
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Reputación actualizada correctamente',
            'profile' => $profile
        ]);
    }

    /**
     * Eliminar el perfil del usuario (solo el usuario autenticado)
     */
    public function destroy()
    {
        $user = auth()->user();
        $profile = $user->profile;

        if (!$profile) {
            return response()->json([
                'error' => 'Perfil no encontrado'
            ], 404);
        }

        $profile->delete();

        return response()->json([
            'message' => 'Perfil eliminado correctamente'
        ]);
    }
}
