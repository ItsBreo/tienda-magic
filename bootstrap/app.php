<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\SecurityHeaders;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // Configuración para autenticación stateless con Bearer Tokens
        // Sanctum emitirá Opaque Tokens utilizados como Bearer Tokens estándar
        // El middleware auth:sanctum validará exclusivamente la cabecera Authorization
        // Sin statefulApi() para evitar cookies y forzar token explícito

        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Registrar alias para nuestro AdminMiddleware
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
        ]);

        $middleware->web(append: [
            HandleAppearance::class,
            AddLinkHeadersForPreloadedAssets::class,
            SecurityHeaders::class, // Headers de seguridad
        ]);

        $middleware->api(append: [
            // \Illuminate\Http\Middleware\TrimStrings::class,
            // \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
