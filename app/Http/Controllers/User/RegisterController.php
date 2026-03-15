<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role; // Importamos el modelo Role
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use App\Rules\RecaptchaCheck;

class RegisterController extends Controller
{
    /**
     * Registra un nuevo usuario, asigna rol por defecto e inicia sesión.
     *
     * @param Request $request Petición con datos del usuario y reCAPTCHA
     * @return JsonResponse Respuesta JSON confirmando el registro
     */
    public function store(Request $request): JsonResponse
    {
        // Validación estricta para prevenir datos maliciosos
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ]);

        // Creamos usuario con hash seguro de contraseña
        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'wallet_balance' => 0,
        ]);

        // Asignar el rol 'user' por defecto al nuevo usuario
        $defaultRole = Role::where('name', 'user')->first();
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->id);
        }

        // Disparamos evento para notificaciones posteriores (email verification, etc.)
        event(new Registered($user));

        // Iniciar sesión automáticamente tras el registro usando el guard por defecto (sesiones/cookies)
        Auth::login($user);

        // Regenerar la sesión para prevenir ataques de fijación de sesión
        $request->session()->regenerate();

        // Devolvemos respuesta (Laravel enviará automáticamente la cookie de sesión en las cabeceras)
        return response()->json([
            'message' => 'Usuario registrado e inicio de sesión exitoso.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'wallet_balance' => $user->wallet_balance,
                'is_admin' => $user->is_admin,
            ]
        ], 201);
    }
}
