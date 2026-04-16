<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsActive
{
    /**
     * Maneja una solicitud entrante y verifica si el usuario está activo.
     * Si no lo está, cierra la sesión e informa al cliente.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->is_active) {
            // Cerramos sesión en el guard actual (JWT)
            Auth::guard('api')->logout();

            return response()->json([
                'message' => 'Tu cuenta ha sido desactivada. Ponte en contacto con el administrador.',
                'error'   => 'account_deactivated'
            ], 403);
        }

        return $next($request);
    }
}
