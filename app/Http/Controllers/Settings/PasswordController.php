<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * En una API, el método 'edit' suele no existir
     * ya que React se encarga de mostrar el formulario.
     */

    /**
     * Update the user's password.
     */
    public function update(Request $request): JsonResponse
    {
        // 1. Validación de datos
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        // 2. Actualización de la contraseña con Hash::make
        // Es vital encriptarla antes de guardar, similar a tu UserController
        $request->user()->update([
            'password' => Hash::make($validated['password']),
        ]);

        // 3. Respuesta JSON en lugar de RedirectResponse
        return response()->json([
            'message' => 'Contraseña actualizada correctamente.'
        ], 200);
    }
}
