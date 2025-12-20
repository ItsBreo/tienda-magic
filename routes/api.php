<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController; // <--- ¡Importante importar tu controlador!

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Todo lo que esté aquí dentro requiere que el usuario envíe su Token
Route::middleware(['auth:sanctum'])->group(function () {

    // Grupo de rutas para el CONTROLADOR DE USUARIO
    // Esto evita que tengas que escribir [UserController::class, ...] en cada línea
    Route::controller(UserController::class)->group(function () {

        // GET /api/user/me -> Para ver quién soy al recargar la página
        Route::get('/user/me', 'current');

        // PUT /api/account/info -> Cambiar username/email
        Route::put('/account/info', 'updateInfo');

        // PUT /api/account/password -> Cambiar contraseña
        Route::put('/account/password', 'changePassword');

        // DELETE /api/account/delete -> Borrar cuenta
        Route::delete('/account/delete', 'destroy');

    });

    // Aquí irían otros controladores (ej: Mazos, Cartas...)
});
