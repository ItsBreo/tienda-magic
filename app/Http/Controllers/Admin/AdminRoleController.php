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
    public function index(Request $request)
    {
        $sortBy = $request->query('sort_by', 'id');
        $sortDir = $request->query('sort_dir', 'asc');

        $allowedColumns = ['id', 'name', 'created_at'];
        if (!in_array($sortBy, $allowedColumns)) {
            $sortBy = 'id';
        }

        $roles = Role::withTrashed()
            ->orderBy($sortBy, $sortDir)
            ->paginate(50);
            
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
            new OA\Property(property: "description", type: "string", nullable: true),
            new OA\Property(property: "permission_ids", type: "array", items: new OA\Items(type: "integer"))
        ])
    )]
    #[OA\Response(response: 201, description: "Rol creado")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'description' => 'nullable|string|max:1000',
            'permission_ids' => 'sometimes|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $role = Role::create([
            'name' => $validated['name'],
            'description' => $validated['description'] ?? null,
            'permission_ids' => $validated['permission_ids'] ?? []
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
            new OA\Property(property: "description", type: "string", nullable: true),
            new OA\Property(property: "permission_ids", type: "array", items: new OA\Items(type: "integer"))
        ])
    )]
    #[OA\Response(response: 200, description: "Rol actualizado")]
    public function update(Request $request, Role $role)
    {
        $validated = $request->validate([
            // Ignoramos el ID del propio rol para la regla unique, permitiendo guardar sin cambiar el nombre
            'name' => ['required', 'string', 'max:255', Rule::unique('roles')->ignore($role->id)],
            'description' => 'nullable|string|max:1000',
            'permission_ids' => 'sometimes|array',
            'permission_ids.*' => 'exists:permissions,id'
        ]);

        $role->name = $validated['name'];
        if (isset($validated['description'])) {
            $role->description = $validated['description'];
        }

        if (isset($validated['permission_ids'])) {
            $role->permission_ids = $validated['permission_ids'];
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

        // Soft Delete (exilio)
        $role->delete();

        return response()->json(['message' => 'Rol exiliado exitosamente.']);
    }

    public function restore(Role $role)
    {
        // Validar que el rol esté exiliado (soft deleted)
        if (!$role->trashed()) {
            return response()->json(['message' => 'Solo se puede restaurar roles que han sido exiliados.'], 403);
        }

        // Restore (restaurar soft delete)
        $role->restore();

        return response()->json(['message' => 'Rol restaurado exitosamente.']);
    }

    public function forceDelete(Role $role)
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

        // Validar que el rol ya esté exiliado (soft deleted)
        if (!$role->trashed()) {
            return response()->json(['message' => 'Solo se puede eliminar definitivamente roles que ya han sido exiliados.'], 403);
        }

        // Si el rol tiene usuarios, limpiamos sus usuarios
        $role->users()->detach();

        // Force Delete (borrado físico)
        $role->forceDelete();

        return response()->json(['message' => 'Rol eliminado permanentemente.']);
    }

    /**
     * Acciones Masivas (Bulk Actions)
     */

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:roles,id'
        ]);

        $protectedRoles = [
            'super_admin', 'admin',
            'mod_news', 'mod_tournaments', 'mod_general',
            'user', 'usuario',
        ];

        // Obtenemos los roles que no están protegidos
        $rolesToDelete = Role::whereIn('id', $validated['ids'])
            ->whereNotIn('name', $protectedRoles)
            ->get();

        foreach ($rolesToDelete as $role) {
            $role->users()->detach();
            $role->delete();
        }

        return response()->json([
            'message' => count($rolesToDelete) . ' roles exiliados correctamente.',
            'protected' => count($validated['ids']) - count($rolesToDelete)
        ]);
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:roles,id'
        ]);

        $count = Role::onlyTrashed()->whereIn('id', $validated['ids'])->restore();

        return response()->json([
            'message' => "{$count} roles restaurados correctamente."
        ]);
    }

    public function bulkForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:roles,id'
        ]);

        $protectedRoles = [
            'super_admin', 'admin',
            'mod_news', 'mod_tournaments', 'mod_general',
            'user', 'usuario',
        ];

        // Solo permitir borrar si ya están en la papelera y no son protegidos
        $rolesToForceDelete = Role::onlyTrashed()
            ->whereIn('id', $validated['ids'])
            ->whereNotIn('name', $protectedRoles)
            ->get();

        foreach ($rolesToForceDelete as $role) {
            $role->users()->detach();
            $role->forceDelete();
        }

        return response()->json([
            'message' => count($rolesToForceDelete) . ' roles eliminados permanentemente.'
        ]);
    }
}
