<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Rules\RecaptchaCheck; // Importamos tu regla de reCAPTCHA
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Maneja el intento de inicio de sesión.
     */
    public function store(Request $request)
    {
        // 1. Validamos los datos, incluyendo el reCAPTCHA
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['required', new RecaptchaCheck], // Validamos el token de Google
        ], [
            'recaptcha_token.required' => 'Por favor, completa el reCAPTCHA.',
        ]);

        // 2. Intentamos autenticar al usuario
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        if (!Auth::attempt($credentials, $remember)) {
            // Si falla, lanzamos una excepción que Laravel convierte automáticamente en error 422
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        // 3. Regeneramos la sesión para evitar ataques de fijación de sesión
        $request->session()->regenerate();

        // 4. Respondemos con los datos del usuario y un mensaje de éxito
        return response()->json([
            'message' => '¡Inicio de sesión exitoso!',
            'user' => Auth::user(),
        ]);
    }

    /**
     * Cierra la sesión del usuario.
     */
    public function destroy(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
