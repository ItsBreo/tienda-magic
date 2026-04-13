<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminRoleController extends Controller
{
    /**
     * Display a listing of the roles.
     */
    public function index()
    {
        // Traemos todos los roles
        $roles = Role::orderBy('id')->get();
        return response()->json($roles);
    }

    /**
     * Store a newly created role in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:1000'
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null
        ]);

        return response()->json([
            'message' => 'Rol creado exitosamente',
            'role' => $role
        ], 201);
    }

    /**
     * Update the specified role in storage.
     */
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            // Ignoramos el ID del propio rol para la regla unique, permitiendo guardar sin cambiar el nombre
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'description' => 'nullable|string|max:1000'
        ]);

        $role->name = $validated['name'];
        if (isset($validated['description'])) {
            $role->description = $validated['description'];
        }
        $role->save();

        return response()->json([
            'message' => 'Rol actualizado exitosamente',
            'role' => $role
        ]);
    }

    /**
     * Remove the specified role from storage.
     */
    public function destroy(Role $role)
    {
        // Roles protegidos del sistema — nunca se pueden borrar
        $protectedRoles = [
            'super_admin', 'admin',
            'mod_news', 'mod_tournaments', 'mod_general',
            'user', 'usuario',
        ];

        if (in_array(strtolower($role->name), $protectedRoles)) {
            return response()->json(['message' => 'No puedes eliminar este rol protegido del sistema.'], 403);
        }

        // Si el rol tiene usuarios, se rompe la Foregin Key en user_role (a menos que tengamos onDelete cascade)
        // Por seguridad limpiamos sus usuarios
        $role->users()->detach();

        $role->delete();

        return response()->json(['message' => 'Rol eliminado exitosamente.']);
    }
}
