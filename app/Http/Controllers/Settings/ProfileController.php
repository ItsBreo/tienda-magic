<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de configuración de perfil de usuario.
 *
 * Maneja la actualización y eliminación del perfil del usuario autenticado.
 */
class ProfileController extends Controller
{
    /**
     * Devuelve datos actuales del usuario para formulario de perfil.
     *
     * @param Request $request
     * @return JsonResponse
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
     * Actualiza configuración del perfil del usuario.
     *
     * @param ProfileUpdateRequest $request
     * @return RedirectResponse
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $user->fill($request->validated());

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();

        return redirect()->route('profile.edit')->with('status', 'profile-updated');
    }

    /**
     * Elimina cuenta de usuario.
     *
     * @param Request $request
     * @return RedirectResponse
     */
    public function destroy(Request $request): RedirectResponse
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

        return redirect()->route('home');
    }
}
