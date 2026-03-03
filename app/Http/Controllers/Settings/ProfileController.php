<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class ProfileController extends Controller
{
    /**
     * En la API, el método 'edit' suele sustituirse por uno que
     * devuelve los datos actuales del usuario para rellenar el formulario.
     */
    public function edit(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'), // Opcional en API
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return response()->json([
            'message' => 'Perfil actualizado con éxito.',
            'user' => $user
        ]);
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        // En API con Sanctum, solemos revocar el token en lugar de solo Logout
        if (method_exists($user, 'tokens')) {
            $user->tokens()->delete();
        }

        Auth::guard('web')->logout(); // Logout de la sesión si existe

        $user->delete();

        // En una API pura, no se suele invalidar sesión, pero se devuelve éxito
        return response()->json([
            'message' => 'Cuenta eliminada correctamente.'
        ]);
    }
}
