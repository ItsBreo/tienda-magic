<?php

use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\CheckoutController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\Shop\CatalogController;
use App\Http\Controllers\Settings\TwoFactorAuthenticationController;
use App\Http\Controllers\Shop\DepositController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Hybrid SPA + Backend Routes
|--------------------------------------------------------------------------
|
| Estructura híbrida para SPA con React Router + Tests de Laravel:
| - Rutas GET devuelven view('app') para React Router pero con nombres para tests
| - Rutas POST/PUT/DELETE apuntan a controladores para JSON/Axios
| - Catch-all final sirve la SPA para cualquier ruta no definida
|
*/

// Rutas GET principales (Vistas de React Router con nombres para tests)
Route::get('/', function () {
    return view('app');
})->name('home');

Route::get('/dashboard', function () {
    return view('app');
})->name('dashboard')->middleware('auth');

Route::get('/shop', [CatalogController::class, 'index'])->name('shop.index');

// Rutas de perfil (GET para vistas, POST/PUT/DELETE para lógica)
Route::middleware('auth')->group(function () {
    // Rutas de perfil - GET devuelven vista SPA
    Route::get('/settings/profile', function () {
        return view('app');
    })->name('profile.edit');

    Route::get('/settings/password', function () {
        return view('app');
    })->name('user-password.edit');

    Route::get('/settings/two-factor', [TwoFactorAuthenticationController::class, 'show'])->name('two-factor.show');

    // Rutas de perfil - POST/PUT/DELETE para lógica del backend
    Route::patch('/settings/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    Route::put('/settings/password', [PasswordController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('user-password.update');
});

// Rutas POST/PUT/DELETE (Lógica del Backend - JSON para Axios)
Route::middleware('auth')->group(function () {
    // Carrito
    Route::post('/cart/add', [CartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/destroy/{id}', [CartController::class, 'destroy'])->name('cart.destroy');

    // Checkout
    Route::post('/checkout', [CheckoutController::class, 'process'])->name('checkout.process');

    // Billetera
    Route::post('/wallet/deposit', [DepositController::class, 'store'])->name('wallet.deposit');
});

// Catch-all final para React Router (siempre al final)
Route::fallback(function () {
    return view('app');
});
