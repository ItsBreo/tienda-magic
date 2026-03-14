<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Rules\RecaptchaCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * Controlador de autenticación de usuarios.
 *
 * Maneja el proceso de login/logout con generación de tokens JWT
 * para autenticación stateless en API REST.
 */
class LoginController extends Controller
{
    /**
     * Autentica al usuario y genera token JWT.
     *
     * Arquitectura stateless: No utiliza sesiones, solo JWT Bearer Tokens.
     * JWT emite tokens firmados con claims estándar y custom según configuración.
     *
     * @param Request $request Petición con credenciales y reCAPTCHA
     * @return JsonResponse Respuesta JSON con token JWT
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

        // Verificamos credenciales usando JWTAuth::attempt
        if (!$token = JWTAuth::attempt($credentials)) {
            // Error genérico para no revelar si el email existe o no
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        $user = Auth::user();

        // Logout de cualquier sesión existente para mantener pureza stateless
        Auth::guard('web')->logout();

        // Devolvemos token JWT en formato JSON estándar
        return response()->json([
            'data' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in' => config('jwt.ttl', 60) * 60 // TTL en segundos
        ]);
    }

    /**
     * Cierra la sesión del usuario e invalida token JWT.
     *
     * En arquitectura stateless, invalida el token actual en el blacklist.
     *
     * @param Request $request Petición de logout
     * @return JsonResponse Confirmación de logout
     */
    public function destroy(Request $request): JsonResponse
    {
        // Invalidamos el token JWT actual
        JWTAuth::invalidate(JWTAuth::getToken());

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
