<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Features;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use App\Rules\RecaptchaCheck;

class LoginController extends Controller
{
    /**
     * En una API, el método 'create' no es necesario ya que React
     * renderiza el formulario de Login por su cuenta.
     */

    /**
     * Handle a login request to the application.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Aplicar rate limiting (se mantiene igual, ya devuelve 429)
        $throttleKey = \Illuminate\Support\Str::transliterate(
            \Illuminate\Support\Str::lower($request->input('email')) . '|' . $request->ip()
        );

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            throw new ThrottleRequestsException(__('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]));
        }

        // 2. Validar las credenciales
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
            'recaptcha_token' => ['required', 'string', new RecaptchaCheck()],
        ]);

        // 3. Intentar autenticar
        if (!Auth::attempt($request->only('email', 'password'), $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        RateLimiter::clear($throttleKey);
        $user = Auth::user();

        // 4. Lógica de Two-Factor Authentication (Adaptada para API)
        if (Features::canManageTwoFactorAuthentication() &&
            $user->hasEnabledTwoFactorAuthentication() &&
            $user->two_factor_confirmed_at) {

            // En lugar de redirección, informamos a React que se requiere 2FA
            Auth::logout(); // Cerramos sesión temporal

            // Opcional: puedes guardar un token temporal o ID en sesión/cache
            $request->session()->put('login.id', $user->id);

            return response()->json([
                'two_factor' => true,
                'message' => 'Se requiere autenticación de dos factores.'
            ]);
        }

        // 5. Respuesta de éxito (Si usas Sanctum, aquí generarías el token)
        // $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Login exitoso',
            'user' => $user,
            // 'access_token' => $token, // Descomenta si usas tokens
        ]);
    }

    /**
     * Log the user out of the application.
     */
    public function destroy(Request $request): JsonResponse
    {
        // Si usas Sanctum, es mejor revocar el token actual
        if ($request->user()) {
            $request->user()->currentAccessToken()->delete();
        }

        Auth::logout();

        // En API con Axios/Sanctum, estas líneas de sesión suelen ser opcionales
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Sesión cerrada correctamente.'
        ]);
    }
}
