<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Aquí solo dejamos una ruta "catch-all" (comodín).
| Como estamos usando React (Vite/Axios) como SPA, Laravel solo
| necesita servir la vista principal (por ejemplo, 'app.blade.php')
| y dejar que React Router maneje todas las URLs (/login, /dashboard, etc).
|
*/

Route::get('/{any}', function () {
    // Aquí pon el nombre de tu archivo blade principal.
    // Por defecto en Laravel con React suele ser 'app' o 'index'
    return view('app');
})->where('any', '.*');

// Nota: Eliminamos el require __DIR__.'/settings.php'; porque asumo
// que esas rutas también las pasaste a formato API.
