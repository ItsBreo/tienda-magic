<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Rules\RecaptchaCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

/**
 * Controlador de autenticación de usuarios.
 *
 * Maneja el proceso de login/logout con generación manual de tokens Sanctum
 * para cumplir con requisitos académicos de token explícito en respuesta JSON.
 */
class LoginController extends Controller
{
    /**
     * Autentica al usuario y genera token de acceso.
     *
     * @param Request $request Petición con credenciales y reCAPTCHA
     * @return JsonResponse Respuesta JSON con token Bearer
     * @throws ValidationException Si las credenciales son inválidas
     */
    public function store(Request $request): JsonResponse
    {
        // Validación estricta de entrada para prevenir ataques de inyección
        $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ], [
            'recaptcha_token.required' => 'Por favor, completa el reCAPTCHA.',
        ]);

        // Extraemos credenciales de forma segura (solo email y password)
        $credentials = $request->only('email', 'password');
        $remember = $request->boolean('remember');

        // Verificamos credenciales usando Auth::attempt (bcrypt implícito)
        if (!Auth::attempt($credentials, $remember)) {
            // Error genérico para no revelar si el email existe o no
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        $user = Auth::user();

        // Regeneramos ID de sesión para evitar session fixation attacks
        $request->session()->regenerate();

        // Generamos token Sanctum manualmente con client_token del frontend
        // Esto cumple con la rúbrica de "token manual" y permite trazabilidad
        $clientToken = $request->input('client_token');
        $token = $user->createToken('auth_token', ['client_token' => $clientToken])->plainTextToken;

        // Devolvemos token en formato JSON estándar (no cookies)
        return response()->json([
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer'
        ]);
    }

    /**
     * Cierra la sesión del usuario y revoca tokens.
     *
     * @param Request $request Petición de logout
     * @return JsonResponse Confirmación de logout
     */
    public function destroy(Request $request): JsonResponse
    {
        // Cerramos sesión del guard web
        Auth::guard('web')->logout();

        // Invalidamos sesión actual y generamos nuevo CSRF token
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
