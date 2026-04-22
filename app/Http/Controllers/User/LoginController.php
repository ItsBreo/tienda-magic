<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Rules\RecaptchaCheck;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;
use App\Services\AuditLogger;

class LoginController extends Controller
{
    /**
     * Autentica al usuario y devuelve un token Sanctum.
     * Usa Laravel Sanctum para autenticación basada en tokens.
     *
     * @param  Request $request
     * @return JsonResponse
     * @throws ValidationException
     */
    #[OA\Post(
        path: "/api/login",
        summary: "Iniciar sesión de usuario",
        description: "Autentica al usuario con email y contraseña, devolviendo un token Sanctum para peticiones protegidas.",
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
        description: "Login exitoso, devuelve token Sanctum",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "Sesión iniciada correctamente."),
                new OA\Property(property: "token", type: "string", example: "1|abcdef123456..."),
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

        // Buscar el usuario por email
        $user = User::where('email', $credentials['email'])->first();

        // Validar si el usuario existe y la contraseña es correcta
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            AuditLogger::log('auth.failed', null, ['email' => $request->email]);
            Log::warning('Failed login attempt', ['email' => $request->email]);
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        // Validar si el usuario está activo
        if (!$user->is_active) {
            Log::warning('Login blocked for inactive user', ['user_id' => $user->id]);
            throw ValidationException::withMessages([
                'email' => ['Tu cuenta ha sido desactivada. Ponte en contacto con soporte.'],
            ]);
        }

        // Iniciar sesión basada en cookies (SPA Stateful)
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        Log::info('Successful login', ['user_id' => $user->id]);
        $user->load('profile');
        AuditLogger::log('auth.login', $user);

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            'data'    => $user,
        ]);
    }

    /**
     * Invalida el token Sanctum actual del usuario.
     *
     * @param  Request $request
     * @return JsonResponse
     */
    public function destroy(Request $request): JsonResponse
    {
        $user = Auth::guard('web')->user();
        
        // Revocar token de api si existiera (sólo por precaución)
        if ($user && $request->user()?->currentAccessToken()) {
            $request->user()->currentAccessToken()->delete();
        }

        Log::info('User logged out', ['user_id' => $user?->id]);
        if ($user) {
            AuditLogger::log('auth.logout', $user);
        }

        // Destruir sesión stateful de Sanctum SPA
        Auth::guard('web')->logout();
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
