<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Shop\DepositController;
use App\Http\Controllers\Shop\CatalogController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\DeckController;
use App\Http\Controllers\Inventory\WalletTransactionController;
use App\Http\Controllers\User\UserController;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    // Ruta para la pagina de dashboard
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // Ruta para la pagina de tienda
    Route::get('/shop', [CatalogController::class, 'index'])->name('shop.index');

    // Ruta para la pagina de depositos
    Route::post('/wallet/deposit', [DepositController::class, 'store'])->name('wallet.deposit');

    // Ruta para la pagina de carrito
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [CartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/item/{id}', [CartController::class, 'destroy'])->name('cart.destroy');

    // Ruta para la pagina de checkout
    Route::post('/checkout', [OrderController::class, 'store'])->name('checkout.process');

    // Rutas de Inventory (Mazos, Wallet, Inventario público/ventas)
    Route::get('/inventory/{user}', [InventoryController::class, 'showInventory'])->name('inventory.show');
    Route::get('/inventory/{user}/sale', [InventoryController::class, 'showInventoryInSale'])->name('inventory.sale');

    // Rutas para mazos
    Route::get('/decks', [DeckController::class, 'index'])->name('decks.index');
    Route::post('/decks', [DeckController::class, 'store'])->name('decks.store');
    Route::get('/decks/{id}', [DeckController::class, 'show'])->name('decks.show');
    Route::post('/decks/{deckId}/cards', [DeckController::class, 'addCard'])->name('decks.cards.add');
    Route::delete('/decks/{deckId}/cards/{cardId}', [DeckController::class, 'removeCard'])->name('decks.cards.remove');

    // Historial de transacciones del wallet
    Route::get('/wallet/transactions', [WalletTransactionController::class, 'index'])->name('wallet.transactions');

    // Rutas de usuario (perfil, ajustes, ventas y compras)
    Route::get('/user', [UserController::class, 'show'])->name('user.show');
    Route::patch('/user', [UserController::class, 'updateProfile'])->name('user.update');
    Route::patch('/user/password', [UserController::class, 'updatePassword'])->name('user.password.update');
    Route::delete('/user', [UserController::class, 'destroyUser'])->name('user.destroy');
    Route::get('/user/decks', [UserController::class, 'showDecks'])->name('user.decks');
    Route::get('/user/favorites', [UserController::class, 'showFavoriteCards'])->name('user.favorites');
    Route::get('/user/sales', [UserController::class, 'sales'])->name('user.sales.index');
    Route::get('/user/sales/stats', [UserController::class, 'salesStats'])->name('user.sales.stats');
    Route::get('/user/orders', [UserController::class, 'orderHistory'])->name('user.orders.history');
    Route::get('/user/balance', [UserController::class, 'getBalance'])->name('user.balance');
    Route::get('/user/transactions', [UserController::class, 'transactions'])->name('user.transactions');
});

require __DIR__.'/settings.php';
