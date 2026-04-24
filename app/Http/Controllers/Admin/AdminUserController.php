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
    public function index(Request $request)
    {
        $sortBy = $request->query('sort_by', 'created_at');
        $sortDir = $request->query('sort_dir', 'desc');

        $allowedColumns = ['id', 'name', 'username', 'email', 'created_at'];
        if (!in_array($sortBy, $allowedColumns)) {
            $sortBy = 'created_at';
        }

        $users = User::withTrashed()
            ->with('roles')
            ->orderBy($sortBy, $sortDir)
            ->paginate(20);

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
            'name'      => 'required|string|max:255',
            'username'  => 'required|string|max:20|unique:users',
            'email'     => 'required|string|email|max:255|unique:users',
            'password'  => 'required|string|min:8',
            'role_id'   => 'required|exists:roles,id',
            'forum_id'  => 'nullable|exists:forums,id',
        ]);

        $user = User::create([
            'name'           => $validated['name'],
            'username'       => $validated['username'],
            'email'          => $validated['email'],
            'password'       => Hash::make($validated['password']),
            'wallet_balance' => 0,
            'is_active'      => true,
        ]);

        $user->roles()->attach($validated['role_id'], [
            'forum_id' => $request->input('forum_id'),
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
            new OA\Property(property: "forum_id", type: "integer", nullable: true)
        ])
    )]
    #[OA\Response(response: 200, description: "Usuario actualizado")]
    public function update(Request $request, $id)
    {
        $user = User::withTrashed()->findOrFail($id);
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'username'  => ['required', 'string', 'max:20', Rule::unique('users')->ignore($user->id)],
            'email'     => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'password'  => 'nullable|string|min:8',
            'role_id'   => 'required',
            'forum_id'  => 'nullable',
        ]);

        $user->name      = $validated['name'];
        $user->username  = $validated['username'];
        $user->email     = $validated['email'];

        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        // Sincronizamos el rol con su forum_id (borra los anteriores y pone este)
        $user->roles()->sync([
            $validated['role_id'] => ['forum_id' => $request->input('forum_id')],
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
        summary: "Exiliar usuario (Soft Delete)",
        description: "Exilia una cuenta de usuario (Soft Delete). Solo se puede eliminar definitivamente si ya está exiliado.",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Usuario exiliado exitosamente")]
    #[OA\Response(response: 403, description: "No puedes eliminar tu propia cuenta")]
    public function destroy(Request $request, User $user)
    {
        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'No puedes exiliar tu propia cuenta. La autoinmolación no está permitida en este plano.'
            ], 403);
        }

        // Soft Delete (exilio)
        $user->delete();

        // Ocultar sus listings del mercado mientras esté exiliado
        \Illuminate\Support\Facades\DB::table('market_listings')
            ->where('seller_id', $user->id)
            ->where('status', 'active')
            ->update(['status' => 'suspended']);

        return response()->json(['message' => 'Usuario exiliado exitosamente. Los objetos que tenía en el mercado han sido retirados temporalmente.']);
    }

    #[OA\Post(
        path: "/api/admin/users/{userId}/restore",
        summary: "Restaurar usuario exiliado",
        description: "Restaura una cuenta de usuario que ha sido exiliada (Soft Delete).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Usuario restaurado exitosamente")]
    #[OA\Response(response: 403, description: "Solo se puede restaurar usuarios exiliados")]
    public function restore(User $user)
    {
        // Validar que el usuario esté exiliado (soft deleted)
        if (!$user->trashed()) {
            return response()->json(['message' => 'Solo se puede restaurar usuarios que han sido exiliados.'], 403);
        }

        // Restore (restaurar soft delete)
        $user->restore();

        // Volver a poner en venta sus listings si estaban suspendidos por exilio
        \Illuminate\Support\Facades\DB::table('market_listings')
            ->where('seller_id', $user->id)
            ->where('status', 'suspended')
            ->update(['status' => 'active']);

        return response()->json(['message' => 'Usuario restaurado exitosamente. Sus objetos vuelven a estar disponibles en el mercado.']);
    }

    #[OA\Delete(
        path: "/api/admin/users/{userId}/force-delete",
        summary: "Eliminar usuario definitivamente",
        description: "Elimina permanentemente una cuenta de usuario (solo si ya está exiliada).",
        tags: ["Admin"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "userId", in: "path", required: true, description: "ID del usuario", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Usuario eliminado permanentemente")]
    #[OA\Response(response: 403, description: "Solo se puede eliminar usuarios exiliados")]
    public function forceDelete(Request $request, $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json([
                'message' => 'No puedes eliminar definitivamente tu propia cuenta.'
            ], 403);
        }

        // Validar que el usuario ya esté exiliado (soft deleted)
        if (!$user->trashed()) {
            return response()->json(['message' => 'Solo se puede eliminar definitivamente usuarios que ya han sido exiliados.'], 403);
        }

        // Force Delete (borrado físico)
        $user->forceDelete();

        return response()->json(['message' => 'Usuario eliminado permanentemente.']);
    }

    /**
     * Acciones Masivas (Bulk Actions)
     */

    public function bulkDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id'
        ]);

        $authId = (int) $request->user()->id;
        
        // Evitar que el admin se borre a sí mismo en masa
        $ids = array_filter($validated['ids'], fn($id) => (int)$id !== $authId);
        
        if (empty($ids)) {
            return response()->json([
                'message' => 'No se han realizado acciones (intentaste exiliarte a ti mismo).'
            ], 400);
        }

        // Usamos destroy para asegurar que se maneje el soft delete correctamente y se activen eventos
        User::destroy($ids);

        // Suspender listings de mercado
        \Illuminate\Support\Facades\DB::table('market_listings')
            ->whereIn('seller_id', $ids)
            ->where('status', 'active')
            ->update(['status' => 'suspended']);

        $wasSelfExileAttempted = count($validated['ids']) > count($ids);

        return response()->json([
            'message' => count($ids) . ' usuarios exiliados correctamente.' . ($wasSelfExileAttempted ? ' Tu cuenta ha sido protegida y no ha sido alterada.' : '')
        ]);
    }

    public function bulkRestore(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id'
        ]);

        $count = User::onlyTrashed()->whereIn('id', $validated['ids'])->restore();

        // Restaurar listings de mercado
        \Illuminate\Support\Facades\DB::table('market_listings')
            ->whereIn('seller_id', $validated['ids'])
            ->where('status', 'suspended')
            ->update(['status' => 'active']);

        return response()->json([
            'message' => "{$count} usuarios restaurados correctamente."
        ]);
    }

    public function bulkForceDelete(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            // No usamos exists:users,id porque fallaría para los que están en la papelera
            'ids.*' => 'integer'
        ]);

        $ids = $validated['ids'];
        
        // Obtenemos los modelos para que se disparen los eventos de elinado (observer)
        $users = User::withTrashed()->whereIn('id', $ids)->get();
        $count = 0;

        foreach ($users as $user) {
            // Solo forzamos el borrado si ya estaba en papelera
            if ($user->trashed()) {
                $user->forceDelete();
                $count++;
            }
        }

        return response()->json([
            'message' => "{$count} usuarios eliminados permanentemente."
        ]);
    }


    public function bulkChangeRole(Request $request)
    {
        $validated = $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:users,id',
            'role_id' => 'required|exists:roles,id'
        ]);

        $ids = array_diff($validated['ids'], [1]); // Protegemos SuperAdmin

        /** @var \Illuminate\Database\Eloquent\Collection<int, User> $users */
        $users = User::whereIn('id', $ids)->get();
        foreach ($users as $user) {
            $user->roles()->sync([$validated['role_id']]);
        }

        return response()->json([
            'message' => 'Rol actualizado para ' . count($ids) . ' usuarios.',
        ]);
    }
}
