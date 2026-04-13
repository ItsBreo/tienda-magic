<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de roles jerárquico parametrizable.
 *
 * Uso en rutas:
 *   ->middleware('role:super_admin')   → solo super_admin
 *   ->middleware('role:admin')         → admin + super_admin
 *   ->middleware('role:moderator')     → mod_* + admin + super_admin
 *   ->middleware('role:user')          → cualquier usuario autenticado
 *
 * Si se pasan múltiples roles separados por coma, se acepta cualquiera de ellos:
 *   ->middleware('role:admin,moderator')
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        foreach ($roles as $role) {
            if ($this->userPassesRole($user, $role)) {
                return $next($request);
            }
        }

        return response()->json([
            'message' => 'Acceso denegado. No tienes los permisos necesarios.',
            'required_roles' => $roles,
        ], 403);
    }

    /**
     * Evalúa si el usuario satisface el rol pedido respetando la jerarquía.
     */
    private function userPassesRole($user, string $role): bool
    {
        return match ($role) {
            'super_admin' => $user->isSuperAdmin(),
            'admin'       => $user->isAdmin(),           // admin + super_admin
            'moderator'   => $user->isModerator() || $user->isAdmin(), // mod_* + admin + super_admin
            'user'        => true,                        // cualquier autenticado
            default       => $user->hasRole($role),
        };
    }
}
