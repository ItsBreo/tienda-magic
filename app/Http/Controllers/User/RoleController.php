<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    /**
     * Mostrar lista de todos los roles
     */
    public function index()
    {
        $roles = Role::all();

        return response()->json([
            'message' => 'Roles obtenidos correctamente',
            'roles' => $roles
        ]);
    }

    /**
     * Mostrar un rol específico
     */
    public function show($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'error' => 'Rol no encontrado'
            ], 404);
        }

        // Cargar usuarios asociados a este rol
        $role->load('users');

        return response()->json([
            'message' => 'Rol obtenido correctamente',
            'role' => $role
        ]);
    }

    /**
     * Crear un nuevo rol
     */
    public function store(Request $request)
    {
        // Validar datos
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name'
        ]);

        // Crear rol
        $role = Role::create($validated);

        return response()->json([
            'message' => 'Rol creado correctamente',
            'role' => $role
        ], 201);
    }

    /**
     * Actualizar un rol existente
     */
    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'error' => 'Rol no encontrado'
            ], 404);
        }

        // Validar datos
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255|unique:roles,name,' . $id
        ]);

        // Actualizar rol
        $role->update($validated);

        return response()->json([
            'message' => 'Rol actualizado correctamente',
            'role' => $role
        ]);
    }

    /**
     * Eliminar un rol
     */
    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json([
                'error' => 'Rol no encontrado'
            ], 404);
        }

        // Verificar si el rol tiene usuarios asociados
        if ($role->users()->exists()) {
            return response()->json([
                'error' => 'No se puede eliminar un rol que tiene usuarios asignados'
            ], 400);
        }

        $role->delete();

        return response()->json([
            'message' => 'Rol eliminado correctamente'
        ]);
    }
}

