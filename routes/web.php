<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use App\Http\Controllers\Shop\MarketplaceController;
use App\Http\Controllers\Shop\depositController;
use App\Http\Controllers\Shop\catalogController;
use App\Http\Controllers\Shop\cartController;
use App\Http\Controllers\Shop\orderController;
use App\Http\Controllers\Inventory\inventoryController;
use App\Http\Controllers\Inventory\deckController;
use App\Http\Controllers\Inventory\walletTransactionController;
use App\Http\Controllers\User\userController;
use App\Http\Controllers\User\loginController;
use App\Http\Controllers\User\registerController;
use App\Http\Controllers\User\userProfileController;
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Card\cardController;
use App\Http\Controllers\Card\cardSetController;
use App\Http\Controllers\Card\packController;
use App\Http\Controllers\Market\marketController;
use App\Http\Controllers\Market\transactionController;
use App\Http\Controllers\Exchange\exchangeController;
use App\Http\Controllers\Exchange\tradeController;
use App\Http\Controllers\Social\forumController;
use App\Http\Controllers\Social\threadController;
use App\Http\Controllers\Social\commentController;
use App\Http\Controllers\Social\profileController as SocialProfileController;
use App\Http\Controllers\searchController;
use App\Http\Controllers\cookieController;

Route::get('/', function () {
    // Mostrar la página de login como página principal
    return view('auth.login-example');
})->name('home');

// Rutas de autenticación (sin middleware auth)
Route::middleware('guest')->group(function () {
    // Rutas de Login
    Route::get('/login', [loginController::class, 'create'])->name('login');
    Route::post('/login', [loginController::class, 'store']);

    // Rutas de Registro
    Route::get('/register', [registerController::class, 'create'])->name('register');
    Route::post('/register', [registerController::class, 'store']);
});

// Rutas protegidas (requieren autenticación)
Route::middleware(['auth', 'verified'])->group(function () {
    // Ruta de Logout
    Route::post('/logout', [loginController::class, 'destroy'])->name('logout');

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // ========== RUTAS DE USUARIO ==========
    // Perfil del usuario autenticado
    Route::get('/user/profile', [userProfileController::class, 'showProfile'])->name('user.profile.show');
    Route::patch('/user/profile', [userProfileController::class, 'show'])->name('user.profile.edit');

    // Perfil de otro usuario
    Route::get('/user/profile/{userId}', [userProfileController::class, 'show'])->name('user.profile');

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

    // ========== RUTAS DE CONFIGURACIÓN ==========
    Route::get('/settings/profile', [SettingsProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings/profile', [SettingsProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [SettingsProfileController::class, 'destroy'])->name('profile.destroy');

    // ========== RUTAS DE TIENDA ==========
    Route::get('/shop', [catalogController::class, 'index'])->name('shop.index');

    // ========== RUTAS DE CARRITO ==========
    Route::get('/cart', [cartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [cartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/item/{id}', [cartController::class, 'destroy'])->name('cart.destroy');

    // ========== RUTAS DE CHECKOUT ==========
    Route::post('/checkout', [orderController::class, 'store'])->name('checkout.process');

    // ========== RUTAS DE WALLET ==========
    Route::post('/wallet/deposit', [depositController::class, 'store'])->name('wallet.deposit');
    Route::get('/wallet/transactions', [walletTransactionController::class, 'index'])->name('wallet.transactions');

    // ========== RUTAS DE INVENTARIO ==========
    Route::get('/inventory', [inventoryController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/{user}', [inventoryController::class, 'userInventory'])->name('inventory.show');
    Route::get('/inventory/{user}/sale', [inventoryController::class, 'userInSale'])->name('inventory.sale');
    Route::get('/my-inventory/sale', [inventoryController::class, 'showInventoryInSale'])->name('inventory.my-sale');

    // ========== RUTAS DE MAZOS ==========
    Route::get('/decks', [deckController::class, 'index'])->name('decks.index');
    Route::post('/decks', [deckController::class, 'store'])->name('decks.store');
    Route::get('/decks/{id}', [deckController::class, 'show'])->name('decks.show');
    Route::get('/decks/explore/all', [deckController::class, 'explore'])->name('decks.explore');
    Route::get('/decks/for-sale/listings', [deckController::class, 'forSale'])->name('decks.for-sale');
    Route::get('/decks/user/{userId}', [deckController::class, 'userPublicDecks'])->name('decks.user.public');
    Route::post('/decks/{deckId}/cards', [deckController::class, 'addCard'])->name('decks.cards.add');
    Route::delete('/decks/{deckId}/cards/{cardId}', [deckController::class, 'removeCard'])->name('decks.cards.remove');

    // ========== RUTAS DE CARTAS ==========
    Route::get('/cards', [cardController::class, 'index'])->name('cards.index');
    Route::get('/cards/{id}', [cardController::class, 'show'])->name('cards.show');
    Route::get('/cards/search/query', [cardController::class, 'search'])->name('cards.search');
    Route::post('/cards/{id}/favorite', [cardController::class, 'addToFavorites'])->name('cards.favorite');
    Route::delete('/cards/{id}/favorite', [cardController::class, 'removeFromFavorites'])->name('cards.unfavorite');

    // ========== RUTAS DE CARD SETS ==========
    Route::get('/card-sets', [cardSetController::class, 'index'])->name('cardsets.index');
    Route::get('/card-sets/{id}', [cardSetController::class, 'show'])->name('cardsets.show');
    Route::get('/card-sets/{id}/cards', [cardSetController::class, 'getCards'])->name('cardsets.cards');

    // ========== RUTAS DE BOOSTER PACKS ==========
    Route::get('/packs', [packController::class, 'index'])->name('packs.index');
    Route::get('/packs/{id}', [packController::class, 'show'])->name('packs.show');

    // ========== RUTAS DE MERCADO ==========
    Route::get('/market', [marketController::class, 'index'])->name('market.index');
    Route::get('/market/cards', [marketController::class, 'listCards'])->name('market.cards.list');
    Route::post('/market/cards', [marketController::class, 'createListing'])->name('market.cards.create');
    Route::get('/market/cards/{id}', [marketController::class, 'showListing'])->name('market.cards.show');
    Route::patch('/market/cards/{id}', [marketController::class, 'updateListing'])->name('market.cards.update');
    Route::delete('/market/cards/{id}', [marketController::class, 'deleteListing'])->name('market.cards.delete');
    Route::post('/market/cards/{id}/buy', [marketController::class, 'buyCard'])->name('market.cards.buy');
    Route::get('/market/transactions', [transactionController::class, 'index'])->name('market.transactions.index');
    Route::get('/market/transactions/{id}', [transactionController::class, 'show'])->name('market.transactions.show');

    // ========== RUTAS DE INTERCAMBIOS ==========
    Route::get('/exchanges', [exchangeController::class, 'index'])->name('exchanges.index');
    Route::post('/exchanges', [exchangeController::class, 'create'])->name('exchanges.create');
    Route::get('/exchanges/{id}', [exchangeController::class, 'show'])->name('exchanges.show');
    Route::post('/exchanges/{id}/propose', [exchangeController::class, 'proposeExchange'])->name('exchanges.propose');
    Route::post('/exchanges/{id}/accept', [exchangeController::class, 'acceptExchange'])->name('exchanges.accept');
    Route::post('/exchanges/{id}/reject', [exchangeController::class, 'rejectExchange'])->name('exchanges.reject');

    // ========== RUTAS DE INTERCAMBIOS (TRADES) ==========
    Route::get('/trades', [tradeController::class, 'index'])->name('trades.index');
    Route::post('/trades', [tradeController::class, 'create'])->name('trades.create');
    Route::get('/trades/{id}', [tradeController::class, 'show'])->name('trades.show');
    Route::post('/trades/{id}/accept', [tradeController::class, 'accept'])->name('trades.accept');
    Route::post('/trades/{id}/reject', [tradeController::class, 'reject'])->name('trades.reject');
    Route::post('/trades/{id}/cancel', [tradeController::class, 'cancel'])->name('trades.cancel');

    // ========== RUTAS DE FORO ==========
    Route::get('/forum', [forumController::class, 'index'])->name('forum.index');
    Route::get('/forum/categories', [forumController::class, 'categories'])->name('forum.categories');
    Route::get('/forum/category/{categoryId}', [forumController::class, 'showCategory'])->name('forum.category.show');
    Route::post('/forum/threads', [forumController::class, 'createThread'])->name('forum.threads.create');

    // ========== RUTAS DE THREADS (TEMAS) ==========
    Route::get('/threads', [threadController::class, 'index'])->name('threads.index');
    Route::get('/threads/{id}', [threadController::class, 'show'])->name('threads.show');
    Route::patch('/threads/{id}', [threadController::class, 'update'])->name('threads.update');
    Route::delete('/threads/{id}', [threadController::class, 'delete'])->name('threads.delete');
    Route::post('/threads/{id}/pin', [threadController::class, 'pin'])->name('threads.pin');
    Route::post('/threads/{id}/lock', [threadController::class, 'lock'])->name('threads.lock');

    // ========== RUTAS DE COMENTARIOS ==========
    Route::post('/comments', [commentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{id}', [commentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{id}', [commentController::class, 'delete'])->name('comments.delete');
    Route::post('/comments/{id}/like', [commentController::class, 'like'])->name('comments.like');

    // ========== RUTAS DE PERFIL SOCIAL ==========
    Route::get('/profile/{userId}', [SocialProfileController::class, 'show'])->name('social.profile.show');
    Route::get('/profile/{userId}/followers', [SocialProfileController::class, 'followers'])->name('social.followers');
    Route::get('/profile/{userId}/following', [SocialProfileController::class, 'following'])->name('social.following');
    Route::post('/profile/{userId}/follow', [SocialProfileController::class, 'follow'])->name('social.follow');
    Route::delete('/profile/{userId}/follow', [SocialProfileController::class, 'unfollow'])->name('social.unfollow');

    // ========== RUTAS DE BÚSQUEDA ==========
    Route::get('/search', [searchController::class, 'index'])->name('search.index');
    Route::get('/search/cards', [searchController::class, 'searchCards'])->name('search.cards');
    Route::get('/search/users', [searchController::class, 'searchUsers'])->name('search.users');
    Route::get('/search/decks', [searchController::class, 'searchDecks'])->name('search.decks');
    Route::get('/search/all', [searchController::class, 'searchAll'])->name('search.all');

    // ========== RUTAS DE COOKIES ==========
    Route::post('/cookies/accept', [cookieController::class, 'accept'])->name('cookies.accept');
    Route::post('/cookies/decline', [cookieController::class, 'decline'])->name('cookies.decline');
});

    Route::get('/marketplace', [MarketplaceController::class, 'index'])
        ->name('marketplace.index')
    ;

require __DIR__.'/settings.php';
