<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\UserProfile;
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

        // Cargamos la relación 'profile'.
        // Si no tiene perfil, $user->profile será null, pero React al menos recibe los datos base del usuario.
        return response()->json([
            'message' => 'Datos obtenidos correctamente',
            'user' => $user->load('profile')
        ]);
    }

    /**
     * Obtener el perfil de un usuario específico
     */
    public function show($userId)
    {
        $user = User::with('profile')->find($userId);

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        return response()->json([
            'message' => 'Perfil obtenido correctamente',
            'user' => $user
        ]);
    }

    /**
     * Crear el perfil para el usuario autenticado
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        if ($user->profile) {
            return response()->json(['error' => 'El usuario ya tiene un perfil'], 400);
        }

        $validated = $request->validate([
            'display_name' => 'required|string|max:255',
            'avatar_url' => 'nullable|url',
            'banner_url' => 'nullable|url',
            'bio' => 'nullable|string|max:500',
            'country' => 'nullable|string|max:100',
            'trade_terms' => 'nullable|string|max:500',
        ]);

        // Añadimos la reputación inicial a los datos validados
        $validated['reputation_score'] = 0;

        // Magia de Laravel: Crea el perfil y le asigna el user_id automáticamente
        $profile = $user->profile()->create($validated);

        return response()->json([
            'message' => 'Perfil creado correctamente',
            'user' => $user->load('profile') // Devolvemos el usuario actualizado
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
            return response()->json(['error' => 'Perfil no encontrado'], 404);
        }

        $validated = $request->validate([
            'display_name' => 'sometimes|string|max:255',
            'avatar_url' => 'sometimes|nullable|url',
            'banner_url' => 'sometimes|nullable|url',
            'bio' => 'sometimes|nullable|string|max:500',
            'country' => 'sometimes|nullable|string|max:100',
            'trade_terms' => 'sometimes|nullable|string|max:500',
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Perfil actualizado correctamente',
            'user' => $user->load('profile')
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
