<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Shop\depositController;
use App\Http\Controllers\Shop\catalogController;
use App\Http\Controllers\Shop\cartController;
use App\Http\Controllers\Shop\orderController;
use App\Http\Controllers\inventoryController;
use App\Http\Controllers\Inventory\deckController;
use App\Http\Controllers\Inventory\walletTransactionController;
use App\Http\Controllers\User\userController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

// Ruta para la pagina de tienda
Route::get('/shop', [catalogController::class, 'index'])->name('shop.index');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Ruta para la pagina de depositos
    Route::post('/wallet/deposit', [depositController::class, 'store'])->name('wallet.deposit');

    // Ruta para la pagina de carrito
    Route::get('/cart', [cartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [cartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/item/{id}', [cartController::class, 'destroy'])->name('cart.destroy');

    // Ruta para la pagina de checkout
    Route::post('/checkout', [orderController::class, 'store'])->name('checkout.process');

    // Rutas de Inventory (Mazos, Wallet, Inventario público/ventas)
    Route::get('/inventory/{user}', [inventoryController::class, 'showInventory'])->name('inventory.show');
    Route::get('/inventory/{user}/sale', [inventoryController::class, 'showInventoryInSale'])->name('inventory.sale');

    // Rutas para mazos
    Route::get('/decks', [deckController::class, 'index'])->name('decks.index');
    Route::post('/decks', [deckController::class, 'store'])->name('decks.store');
    Route::get('/decks/{id}', [deckController::class, 'show'])->name('decks.show');
    Route::post('/decks/{deckId}/cards', [deckController::class, 'addCard'])->name('decks.cards.add');
    Route::delete('/decks/{deckId}/cards/{cardId}', [deckController::class, 'removeCard'])->name('decks.cards.remove');

    // Historial de transacciones del wallet
    Route::get('/wallet/transactions', [walletTransactionController::class, 'index'])->name('wallet.transactions');

    // Rutas de usuario (perfil, ajustes, ventas y compras)
    Route::get('/user', [userController::class, 'show'])->name('user.show');
    Route::patch('/user', [userController::class, 'updateProfile'])->name('user.update');
    Route::patch('/user/password', [userController::class, 'updatePassword'])->name('user.password.update');
    Route::delete('/user', [userController::class, 'destroyUser'])->name('user.destroy');
    Route::get('/user/decks', [userController::class, 'showDecks'])->name('user.decks');
    Route::get('/user/favorites', [userController::class, 'showFavoriteCards'])->name('user.favorites');
    Route::get('/user/sales', [userController::class, 'sales'])->name('user.sales.index');
    Route::get('/user/sales/stats', [userController::class, 'salesStats'])->name('user.sales.stats');
    Route::get('/user/orders', [userController::class, 'orderHistory'])->name('user.orders.history');
    Route::get('/user/balance', [userController::class, 'getBalance'])->name('user.balance');
    Route::get('/user/transactions', [userController::class, 'transactions'])->name('user.transactions');
});

require __DIR__.'/settings.php';
