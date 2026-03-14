<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - SPA Catch-All
|--------------------------------------------------------------------------
|
| Todas las rutas sirven la vista principal de React.
| La lógica de la API está en routes/api.php
|
*/

// Catch-all para React Router
Route::get('/{any?}', function () {
    return view('app');
})->where('any', '.*');
