<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware de admin — acepta tanto 'admin' como 'super_admin'.
 * Se mantiene por compatibilidad con rutas existentes.
 * Para nuevas rutas se recomienda usar RoleMiddleware con 'role:admin'.
 */
class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!$request->user()) {
            return response()->json(['message' => 'No autenticado.'], 401);
        }

        // isAdmin() ya incluye super_admin gracias a la actualización en User.php
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Acceso denegado. Se requiere rol de administrador.',
            ], 403);
        }

        return $next($request);
    }
}
