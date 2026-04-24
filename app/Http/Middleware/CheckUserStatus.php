<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para verificar que el usuario autenticado no haya sido exiliado (soft deleted)
 * o desactivado administrativamente mientras tenía una sesión activa.
 */
class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @return \Symfony\Component\HttpFoundation\Response
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user) {
            // Si el usuario está exiliado (soft deleted)
            if ($user->trashed()) {
                
                $message = 'Tu cuenta ha sido exiliada. Sesión finalizada.';

                // Cerrar sesión
                Auth::guard('web')->logout();
                
                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                return response()->json([
                    'message' => $message,
                    'status' => 'account_blocked'
                ], 403);
            }
        }

        return $next($request);
    }
}
