<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
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
     * Registra un nuevo usuario y devuelve un JWT listo para usar.
     *
     * @param  Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'username'        => ['required', 'string', 'max:255', 'unique:users'],
            'email'           => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password'        => ['required', 'confirmed', Password::defaults()],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'wallet_balance' => 0,
        ]);

        // Asignar rol por defecto
        $defaultRole = Role::where('name', 'User')->first();
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->id);
        }

        event(new Registered($user));

        // Generamos el token JWT directamente para el usuario recién creado
        // así el frontend puede autenticarse sin tener que hacer un segundo request de login
        $token = Auth::guard('api')->login($user);

        return response()->json([
            'message' => 'Usuario registrado e inicio de sesión exitoso.',
            'token'   => $token,          // 👈 Igual que en login, el frontend lo guarda
            'data'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'username'       => $user->username,
                'email'          => $user->email,
                'wallet_balance' => $user->wallet_balance,
                'is_admin'       => $user->is_admin ?? false,
            ],
        ], 201);
    }
}
