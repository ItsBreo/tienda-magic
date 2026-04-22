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
use OpenApi\Attributes as OA;

class RegisterController extends Controller
{
    /**
     * Registra un nuevo usuario y devuelve un token Sanctum listo para usar.
     *
     * @param  Request $request
     * @return JsonResponse
     */
    
        #[OA\Post(
        path: "/api/register",
        summary: "Registrar un usuario",
        description: "Crea un usuario nuevo, le asigna el rol 'user' y lo autentica automáticamente devolviendo un token Sanctum.",
        tags: ["Auth"]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(
            required: ["name", "username", "email", "password", "password_confirmation", "recaptcha_token"],
            properties: [
                new OA\Property(property: "name", type: "string", example: "Nuevo Usuario"),
                new OA\Property(property: "username", type: "string", example: "nuevoUser99"),
                new OA\Property(property: "email", type: "string", format: "email", example: "nuevo@ejemplo.com"),
                new OA\Property(property: "password", type: "string", format: "password", example: "secreta123", minLength: 8),
                new OA\Property(property: "password_confirmation", type: "string", format: "password", example: "secreta123"),
                new OA\Property(property: "recaptcha_token", type: "string", example: "token_generado_por_google"),
            ]
        )
    )]
    #[OA\Response(
        response: 201,
        description: "Usuario registrado con éxito",
        content: new OA\JsonContent(
            properties: [
                new OA\Property(property: "message", type: "string", example: "Usuario registrado e inicio de sesión exitoso."),
                new OA\Property(property: "token", type: "string", example: "1|abcdef123456..."),
                new OA\Property(
                    property: "data",
                    type: "object",
                    properties: [
                        new OA\Property(property: "id", type: "integer", example: 10),
                        new OA\Property(property: "name", type: "string", example: "Nuevo Usuario"),
                        new OA\Property(property: "username", type: "string", example: "nuevoUser99"),
                        new OA\Property(property: "email", type: "string", example: "nuevo@ejemplo.com"),
                        new OA\Property(property: "wallet_balance", type: "integer", example: 0),
                        new OA\Property(property: "is_admin", type: "boolean", example: false),
                    ]
                )
            ]
        )
    )]
    #[OA\Response(
        response: 422,
        description: "Error de validación (email en uso, contraseñas no coinciden, etc.)"
    )]


    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'username'        => ['required', 'string', 'max:255', 'unique:users'],
            'email'           => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:users'],
            'password'        => ['required', 'confirmed', Password::min(8)->letters()->mixedCase()->numbers()->symbols()],
            'recaptcha_token' => ['required', new RecaptchaCheck],
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'wallet_balance' => 0,
        ]);

        // Crear su perfil automáticamente para que se pueda rastrear su reputación (inicia en 100 por la fórmula del modelo)
        $user->profile()->create([
            'display_name'     => $validated['username'],
            'reputation_score' => 0,
        ]);

        // Asignar rol por defecto usando la constante predefinida
        $defaultRole = Role::where('name', User::ROLE_USER)->first();
        if ($defaultRole) {
            $user->roles()->attach($defaultRole->id);
        }

        event(new Registered($user));
        event(new \App\Events\UserRegistered($user));

        // Iniciar sesión Web automáticamente
        Auth::guard('web')->login($user);
        $request->session()->regenerate();

        $user->load('profile');

        return response()->json([
            'message' => 'Usuario registrado e inicio de sesión exitoso.',
            'data'    => [
                'id'             => $user->id,
                'name'           => $user->name,
                'username'       => $user->username,
                'email'          => $user->email,
                'wallet_balance' => $user->wallet_balance,
                'is_admin'       => $user->is_admin ?? false,
                'reputation'     => $user->reputation,
                'avatar_url'     => $user->avatar_url,
            ],
        ], 201);
    }
}
