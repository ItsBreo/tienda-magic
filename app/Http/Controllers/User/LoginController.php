<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Rules\RecaptchaCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Autentica al usuario creando una sesión y cookie tradicional.
     *
     * @param Request $request Petición con credenciales y reCAPTCHA
     * @return JsonResponse Respuesta JSON confirmando el login
     * @throws ValidationException Si las credenciales son inválidas
     */
    public function store(Request $request): JsonResponse
    {
        // Validación estricta de entrada
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ], [
            'recaptcha_token.required' => 'Por favor, completa el reCAPTCHA.',
        ]);

        $credentials = $request->only('email', 'password');

        // Intentamos autenticar usando el sistema de sesiones nativo de Laravel
        if (Auth::attempt($credentials)) {
            // Regeneramos la sesión para mayor seguridad (previene session fixation)
            $request->session()->regenerate();

            return response()->json([
                'message' => 'Sesión iniciada correctamente.',
                'data' => Auth::user()
            ]);
        }

        // Error genérico si falla
        throw ValidationException::withMessages([
            'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
        ]);
    }

    /**
     * Cierra la sesión del usuario y destruye la cookie.
     *
     * @param Request $request Petición de logout
     * @return JsonResponse Confirmación de logout
     */
    public function destroy(Request $request): JsonResponse
    {
        // Cierra la sesión web
        Auth::logout();

        // Invalida la sesión actual en el servidor
        $request->session()->invalidate();

        // Regenera el token CSRF para evitar ataques de falsificación de peticiones
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
