<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use OpenApi\Attributes as OA;

class AdminRoleController extends Controller
{
    #[OA\Get(
        path: "/api/admin/roles",
        summary: "Lista de roles",
        description: "Obtiene una lista de roles de sistema disponibles (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de roles")]
    public function index()
    {
        // Traemos todos los roles
        $roles = Role::orderBy('id')->get();
        return response()->json($roles);
    }

    #[OA\Post(
        path: "/api/admin/roles",
        summary: "Crear rol",
        description: "Crea un nuevo rol (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "description", type: "string", nullable: true)
        ])
    )]
    #[OA\Response(response: 201, description: "Rol creado")]
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

    #[OA\Put(
        path: "/api/admin/roles/{roleId}",
        summary: "Actualizar rol",
        description: "Actualiza un rol (solo admins).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "roleId", in: "path", required: true, description: "ID del rol", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "name", type: "string"),
            new OA\Property(property: "description", type: "string", nullable: true)
        ])
    )]
    #[OA\Response(response: 200, description: "Rol actualizado")]
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

    #[OA\Delete(
        path: "/api/admin/roles/{roleId}",
        summary: "Eliminar rol",
        description: "Elimina un rol si no es crítico de sistema.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "roleId", in: "path", required: true, description: "ID del rol", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Rol eliminado exitosamente")]
    #[OA\Response(response: 403, description: "No puedes eliminar un rol protegido")]
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
