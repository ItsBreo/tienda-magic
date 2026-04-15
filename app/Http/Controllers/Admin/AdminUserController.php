<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

class AdminUserController extends Controller
{
    #[OA\Get(
        path: "/api/admin/users",
        summary: "Lista de usuarios",
        description: "Obtiene una lista paginada de todos los usuarios registrados (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de usuarios")]
    public function index()
    {
        // Traemos a los usuarios ordenados por creación con sus roles
        $users = User::with('roles')->latest()->paginate(20);
        return response()->json($users);
    }

    #[OA\Post(
        path: "/api/admin/users",
        summary: "Crear usuario",
        description: "Crea un usuario administrativamente.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "username", type: "string"),
            new OA\Property(property: "email", type: "string", format: "email"),
            new OA\Property(property: "password", type: "string"),
            new OA\Property(property: "role_id", type: "integer"),
            new OA\Property(property: "forum_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Usuario creado exitosamente")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => 'required|string|max:20|unique:users',
            'email'    => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id'  => 'required|exists:roles,id',
            'forum_id' => 'nullable|exists:forums,id',
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'wallet_balance' => 0,
        ]);

        $user->roles()->attach($validated['role_id'], [
            'forum_id' => $validated['forum_id'] ?? null,
        ]);

        return response()->json([
            'message' => 'Usuario creado exitosamente',
            'user'    => $user->load('roles'),
        ], 201);
    }

    #[OA\Put(
        path: "/api/admin/users/{userId}",
        summary: "Actualizar usuario",
        description: "Actualiza los datos y configuraciones primarias de un usuario.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "username", type: "string"),
            new OA\Property(property: "email", type: "string", format: "email"),
            new OA\Property(property: "password", type: "string", nullable: true),
            new OA\Property(property: "role_id", type: "integer"),
            new OA\Property(property: "forum_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 200, description: "Usuario actualizado")]
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name'     => 'required|string|max:255',
            'username' => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'email'    => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'role_id'  => 'required|exists:roles,id',
            'forum_id' => 'nullable|exists:forums,id',
        ]);

        $user->name     = $validated['name'];
        $user->username = $validated['username'];
        $user->email    = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        // Sincronizamos el rol con su forum_id (borra los anteriores y pone este)
        $user->roles()->sync([
            $validated['role_id'] => ['forum_id' => $validated['forum_id'] ?? null],
        ]);

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'user'    => $user->load('roles'),
        ]);
    }

    #[OA\Post(
        path: "/api/admin/users/{userId}/assign-role",
        summary: "Asignar rol a usuario",
        description: "Reglas de jerarquía aplican. Solo super_admin asigna super_admin.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "role_id", type: "integer"),
            new OA\Property(property: "forum_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 200, description: "Rol asignado correctamente")]
    #[OA\Response(response: 403, description: "Prohibido")]
    #[OA\Response(response: 422, description: "Falta asignar ID de foro a moderador")]
    public function assignRole(Request $request, User $user)
    {
        $authUser = $request->user();

        $validated = $request->validate([
            'role_id'  => 'required|exists:roles,id',
            'forum_id' => 'nullable|exists:forums,id',
        ]);

        $role = Role::findOrFail($validated['role_id']);

        // Solo super_admin puede asignar el rol super_admin
        if (strtolower($role->name) === 'super_admin' && !$authUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Solo un super_admin puede asignar ese rol.',
            ], 403);
        }

        // Validar que los moderadores sectoriales tengan forum_id
        if (in_array(strtolower($role->name), \App\Models\User::MOD_ROLES) && empty($validated['forum_id'])) {
            return response()->json([
                'message' => 'Los moderadores sectoriales necesitan un forum_id asignado.',
            ], 422);
        }

        // Evitar que un admin se degrade a sí mismo
        if ($authUser->id === $user->id) {
            return response()->json([
                'message' => 'No puedes cambiar tu propio rol.',
            ], 403);
        }

        // Sincronizar: borra roles anteriores y asigna el nuevo
        $user->roles()->sync([
            $validated['role_id'] => ['forum_id' => $validated['forum_id'] ?? null],
        ]);

        return response()->json([
            'message' => "Rol '{$role->name}' asignado correctamente a {$user->username}.",
            'user'    => $user->load('roles'),
        ]);
    }

    #[OA\Delete(
        path: "/api/admin/users/{userId}",
        summary: "Eliminar usuario",
        description: "Elimina una cuenta de usuario.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Usuario eliminado exitosamente")]
    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado exitosamente.']);
    }
}
