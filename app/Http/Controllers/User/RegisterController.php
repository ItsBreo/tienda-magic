<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;

class RegisterController extends Controller
{
    /**
     * Display the registration view.
     *
     * @return \Illuminate\View\View
     */
    public function create()
    {
        return Inertia::render('auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\RedirectResponse
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request)
    {
        // Validar los datos del registro
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // Hash de la contraseña
        $validated['password'] = Hash::make($validated['password']);

        // Crear el usuario con saldo inicial de wallet
        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => $validated['password'],
            'wallet_balance' => 0, // Saldo inicial
        ]);

        // Disparar evento de usuario registrado
        event(new Registered($user));

        // Autenticar al usuario
        Auth::login($user);

        // Regenerar la sesión para prevenir ataques de fijación de sesión
        // Esto es una práctica de seguridad recomendada después de autenticación exitosa
        // IMPORTANTE: Regenerar la sesión DESPUÉS del login mantiene la autenticación
        // porque Laravel copia los datos de la sesión anterior (incluyendo auth) a la nueva
        $request->session()->regenerate();

        // Redirigir al dashboard
        return redirect()->route('dashboard');
    }
}
