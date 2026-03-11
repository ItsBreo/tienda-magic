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
     * Arquitectura stateless: No utiliza sesiones, solo Bearer Tokens.
     * Sanctum emite Opaque Tokens de 64 caracteres utilizados como Bearer estándar.
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

        // Verificamos credenciales usando Auth::attempt sin remember (stateless)
        if (!Auth::attempt($credentials)) {
            // Error genérico para no revelar si el email existe o no
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        $user = Auth::user();

        // Generamos token Sanctum manualmente - Opaque Token de 64 caracteres
        // Este token se utiliza como Bearer Token estándar en cabecera Authorization
        $clientToken = $request->input('client_token');
        $token = $user->createToken('auth_token', ['client_token' => $clientToken])->plainTextToken;

        // Logout de cualquier sesión existente para mantener pureza stateless
        Auth::guard('web')->logout();

        // Devolvemos token en formato JSON estándar (sin cookies)
        return response()->json([
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('sanctum.expiration', 525600) // 1 año por defecto
        ]);
    }

    /**
     * Cierra la sesión del usuario y revoca tokens.
     *
     * En arquitectura stateless, revoca el token actual para invalidar acceso.
     *
     * @param Request $request Petición de logout
     * @return JsonResponse Confirmación de logout
     */
    public function destroy(Request $request): JsonResponse
    {
        // Revocamos el token actual que realizó la petición
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
