<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar si está autenticado
        if (!$request->user()) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Verificar si es administrador
        if (!$request->user()->isAdmin()) {
            return response()->json(['message' => 'Acceso denegado. Se requiere rol de administrador.'], 403);
        }

        return $next($request);
    }
}
