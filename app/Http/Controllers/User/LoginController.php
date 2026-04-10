<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Rules\RecaptchaCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class LoginController extends Controller
{
    /**
     * Autentica al usuario y devuelve un JWT.
     * Usa tymon/jwt-auth bajo el capó con el guard 'api'.
     *
     * @param  Request $request
     * @return JsonResponse
     * @throws ValidationException
     */
    #[OA\Post(
        path: "/api/login",
        summary: "Iniciar sesión de usuario",
        description: "Autentica al usuario con email y contraseña, devoliendo un token JWT para peticiones protegidas.",
        tags: ["Auth"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["email", "password", "recaptcha_token"],
            properties: [
                new OA\Property(property: "email", type: "string", format: "email", example: "usuario@ejemplo.com"),
                new OA\Property(property: "password", type: "string", format: "password", example: "secreta123"),
                new OA\Property(property: "recaptcha_token", type: "string", example: "token_generado_por_google"),
            ]
        )
    )]
    #[OA\Response(
        response: 200,
        description: "Login exitoso, devuelve JWT",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "Sesión iniciada correctamente."),
                new OA\Property(property: "token", type: "string", example: "eyJ0eXAiOiJKV1QiLCJhbGci..."),
                new OA\Property(
                    property: "data",
                    type: "object",
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 1),
                        new OA\Property(property: "name", type: "string", example: "Saul"),
                        new OA\Property(property: "email", type: "string", example: "usuario@ejemplo.com"),
                    ]
                )
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: "Error de validación (contraseña incorrecta, falta captcha, etc)"
    )]
    public function store(Request $request): JsonResponse
    {
        // Logging seguro para auditoría (sin exponer datos sensibles)
        Log::info('Login attempt', ['email' => $request->email]);

        // Validación estricta de entrada
        $request->validate([
            'email'           => ['required', 'string', 'email', 'max:255'],
            'password'        => ['required', 'string', 'min:8', 'max:255'],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ], [
            'recaptcha_token.required' => 'Por favor, completa el reCAPTCHA.',
            'email.max' => 'El email no puede exceder 255 caracteres.',
            'password.min' => 'La contraseña debe tener al menos 8 caracteres.',
        ]);

        $credentials = $request->only('email', 'password');

        // Rate limiting implícito mediante throttle middleware
        // Auth::guard('api') usa JWTGuard (tymon/jwt-auth)
        $token = Auth::guard('api')->attempt($credentials);

        if (!$token) {
            Log::warning('Failed login attempt', ['email' => $request->email]);
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        $user = Auth::guard('api')->user();

        Log::info('Successful login', ['user_id' => $user->id]);

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            'token'   => $token,
            'data'    => $user,
        ]);
    }

    /**
     * Invalida el JWT actual en el servidor (lo añade a la blacklist).
     * Requiere que JWT_BLACKLIST_ENABLED=true en .env
     *
     * @param  Request $request
     * @return JsonResponse
     */
    public function destroy(Request $request): JsonResponse
    {
        // invalidate() añade el token a la blacklist de Redis/cache
        // Esta es la forma correcta para arquitectura JWT
        Auth::guard('api')->logout();

        Log::info('User logged out', ['user_id' => $request->user()?->id]);

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
