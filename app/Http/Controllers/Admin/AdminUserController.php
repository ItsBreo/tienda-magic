<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Traemos a los usuarios ordenados por creación con sus roles
        $users = User::with('roles')->latest()->paginate(20);
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
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

    /**
     * Update the specified resource in storage.
     */
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

    /**
     * Asigna o cambia el rol de un usuario (incluyendo forum_id para moderadores).
     *
     * POST /admin/users/{user}/assign-role
     * Body: { role_id: int, forum_id?: int }
     *
     * Reglas:
     *  - Solo admin / super_admin pueden asignar roles.
     *  - Un admin no puede asignar super_admin (solo otro super_admin puede hacerlo).
     *  - Los moderadores sectoriales (mod_*) deben llevar forum_id.
     */
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

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        if (auth()->id() === $user->id) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Usuario eliminado exitosamente.']);
    }
}
