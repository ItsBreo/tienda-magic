<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Shop\depositController;
use App\Http\Controllers\Shop\orderController;
use App\Http\Controllers\Shop\cartController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Ruta para la página de depositos
    Route::post('/wallet/deposit', [depositController::class, 'store'])->name('wallet.deposit');

    // Ruta para la página de carrito
    Route::get('/cart', [cartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [cartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/item/{id}', [cartController::class, 'destroy'])->name('cart.destroy');

    // Ruta para la página de checkout
    Route::post('/checkout', [orderController::class, 'store'])->name('checkout.process');

});

require __DIR__.'/settings.php';
