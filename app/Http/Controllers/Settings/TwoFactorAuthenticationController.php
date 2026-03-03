<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\TwoFactorAuthenticationRequest;
use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Http\JsonResponse;
use Laravel\Fortify\Features;

class TwoFactorAuthenticationController extends Controller implements HasMiddleware
{
    /**
     * Get the middleware that should be assigned to the controller.
     */
    public static function middleware(): array
    {
        // Se mantiene la lógica de confirmación de contraseña si Fortify lo requiere
        return Features::optionEnabled(Features::twoFactorAuthentication(), 'confirmPassword')
            ? [new Middleware('password.confirm', only: ['show'])]
            : [];
    }

    /**
     * Get the user's two-factor authentication settings.
     */
    public function show(TwoFactorAuthenticationRequest $request): JsonResponse
    {
        // Asegura que el estado de la petición sea válido según las reglas de Fortify
        $request->ensureStateIsValid();

        // Retornamos JSON con el estado del 2FA en lugar de renderizar una vista de Inertia
        return response()->json([
            'twoFactorEnabled' => $request->user()->hasEnabledTwoFactorAuthentication(),
            'requiresConfirmation' => Features::optionEnabled(Features::twoFactorAuthentication(), 'confirm'),
            // En una API, podrías querer incluir los códigos de recuperación o el SVG del QR aquí si el 2FA está en proceso
        ]);
    }
}
