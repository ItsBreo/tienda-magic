<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Fortify;
use Laravel\Fortify\Features;
use Illuminate\Http\Exceptions\ThrottleRequestsException;

class LoginController extends Controller
{
    /**
     * Show the login form.
     *
     * @return \Illuminate\View\View
     */
    public function create()
    {
        return Inertia::render('auth/Login', [
            'canResetPassword' => false,
            'canRegister' => true,
            'status' => session('status'),
        ]);
    }

    /**
     * Handle a login request to the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        // Aplicar rate limiting
        $throttleKey = \Illuminate\Support\Str::transliterate(
            \Illuminate\Support\Str::lower($request->input(Fortify::username())).'|'.$request->ip()
        );

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $seconds = RateLimiter::availableIn($throttleKey);

            // Lanzar ThrottleRequestsException que Laravel maneja correctamente
            // Esto devuelve un código 429 sin redirección
            throw new ThrottleRequestsException(__('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]));
        }

        // Validar las credenciales
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
        ]);

        // Intentar autenticar al usuario
        if (!Auth::attempt([
            'email' => $credentials['email'],
            'password' => $credentials['password'],
        ], $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);
            throw ValidationException::withMessages([
                'email' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($throttleKey);

        $user = Auth::user();

        // Verificar si el usuario tiene two-factor authentication habilitado
        if (Features::canManageTwoFactorAuthentication() &&
            Features::enabled(Features::twoFactorAuthentication(), 'confirm') &&
            $user->hasEnabledTwoFactorAuthentication() &&
            $user->two_factor_confirmed_at) {

            // Guardar el ID del usuario en la sesión para el two-factor challenge
            $request->session()->put('login.id', $user->id);

            // Cerrar la sesión actual (el usuario aún no está completamente autenticado)
            Auth::logout();

            // Regenerar la sesión
            $request->session()->regenerate();

            // Redirigir al two-factor challenge
            return redirect()->route('two-factor.login');
        }

        // Regenerar la sesión para prevenir ataques de fijación de sesión
        $request->session()->regenerate();

        // Redirigir al dashboard o a la URL anterior
        return redirect()->intended(route('dashboard'));
    }

    /**
     * Log the user out of the application.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     */
    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
