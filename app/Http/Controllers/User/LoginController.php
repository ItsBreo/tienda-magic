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
     * Autentica al usuario y devuelve un JWT.
     * Usa tymon/jwt-auth bajo el capó con el guard 'api'.
     *
     * @param  Request $request
     * @return JsonResponse
     * @throws ValidationException
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'email'           => ['required', 'string', 'email'],
            'password'        => ['required', 'string'],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ], [
            'recaptcha_token.required' => 'Por favor, completa el reCAPTCHA.',
        ]);

        $credentials = $request->only('email', 'password');

        // Auth::guard('api') usa JWTGuard (tymon/jwt-auth)
        // attempt() valida credenciales y genera el token si son correctas
        $token = Auth::guard('api')->attempt($credentials);

        if (!$token) {
            throw ValidationException::withMessages([
                'email' => ['Las credenciales proporcionadas no coinciden con nuestros registros.'],
            ]);
        }

        $user = Auth::guard('api')->user();

        return response()->json([
            'message' => 'Sesión iniciada correctamente.',
            'token'   => $token,          // 👈 El frontend guarda esto en localStorage
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
        Auth::guard('api')->logout();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.',
        ]);
    }
}
