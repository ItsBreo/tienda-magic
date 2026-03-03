<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Http\JsonResponse;

class RegisterController extends Controller
{
    /**
     * En una API, el método 'create' no es necesario ya que React
     * renderiza el formulario de Registro por su cuenta.
     */

    /**
     * Handle an incoming registration request.
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validar los datos del registro
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        // 2. Crear el usuario con saldo inicial (wallet_balance)
        // Se utiliza Hash::make para la contraseña
        $user = User::create([
            'name' => $validated['name'],
            'username' => $validated['username'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'wallet_balance' => 0,
        ]);

        // 3. Disparar evento de usuario registrado
        event(new Registered($user));

        // 4. Autenticar al usuario
        Auth::login($user);

        // 5. Regenerar la sesión (Si usas cookies/Sanctum)
        $request->session()->regenerate();

        // 6. Respuesta JSON de éxito en lugar de redirección
        return response()->json([
            'message' => 'Usuario registrado y autenticado con éxito.',
            'user' => [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'saldo' => $user->wallet_balance, //
            ]
        ], 201);
    }
}
