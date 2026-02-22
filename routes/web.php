<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
//use Laravel\Fortify\Features;

// Importaciones corregidas a PascalCase
use App\Http\Controllers\Shop\MarketplaceController;
use App\Http\Controllers\Shop\DepositController;
use App\Http\Controllers\Shop\CatalogController;
use App\Http\Controllers\Shop\CartController;
use App\Http\Controllers\Shop\OrderController;
use App\Http\Controllers\Inventory\InventoryController;
use App\Http\Controllers\Inventory\DeckController;
use App\Http\Controllers\Inventory\WalletTransactionController;
use App\Http\Controllers\User\UserController;
use App\Http\Controllers\User\LoginController;
use App\Http\Controllers\User\RegisterController;
use App\Http\Controllers\User\UserProfileController;
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Card\CardController;
use App\Http\Controllers\Card\CardSetController;
use App\Http\Controllers\Card\PackController;
use App\Http\Controllers\Market\MarketController;
use App\Http\Controllers\Market\TransactionController;
use App\Http\Controllers\Exchange\ExchangeController;
use App\Http\Controllers\Exchange\TradeController;
use App\Http\Controllers\Social\ForumController;
use App\Http\Controllers\Social\ThreadController;
use App\Http\Controllers\Social\CommentController;
use App\Http\Controllers\Social\ProfileController as SocialProfileController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\CookieController;

Route::get('/', function () {
    return view('auth.login-example');
})->name('home');

// Rutas de autenticación
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store'])->name('login.store');

    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store');
    
    // Ruta de two-factor challenge (usando la vista de Fortify)
    // Solo accesible si hay un login.id en la sesión (usuario en proceso de autenticación con 2FA)
    Route::get('/two-factor-challenge', function (Request $request) {
        if (!$request->session()->has('login.id')) {
            return redirect()->route('login');
        }
        return Inertia::render('auth/two-factor-challenge');
    })->name('two-factor.login');
});

// Rutas públicas de tienda (accesibles sin autenticación)
Route::get('/shop', [CatalogController::class, 'index'])->name('shop.index');

// Rutas protegidas
Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // ========== RUTAS DE USUARIO ==========
    Route::get('/user/profile', [UserProfileController::class, 'showProfile'])->name('user.profile.show');
    Route::patch('/user/profile', [UserProfileController::class, 'show'])->name('user.profile.edit');
    Route::get('/user/profile/{userId}', [UserProfileController::class, 'show'])->name('user.profile');

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

    // ========== RUTAS DE CONFIGURACIÓN ==========
    Route::get('/settings/profile', [SettingsProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/settings/profile', [SettingsProfileController::class, 'update'])->name('profile.update');
    Route::delete('/settings/profile', [SettingsProfileController::class, 'destroy'])->name('profile.destroy');

    // ========== RUTAS DE CARRITO ==========
    Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
    Route::post('/cart/add', [CartController::class, 'store'])->name('cart.add');
    Route::delete('/cart/item/{id}', [CartController::class, 'destroy'])->name('cart.destroy');

    // ========== RUTAS DE CHECKOUT ==========
    Route::post('/checkout', [OrderController::class, 'store'])->name('checkout.process');

    // ========== RUTAS DE WALLET ==========
    Route::post('/wallet/deposit', [DepositController::class, 'store'])->name('wallet.deposit');
    Route::get('/wallet/transactions', [WalletTransactionController::class, 'index'])->name('wallet.transactions');

    // ========== RUTAS DE INVENTARIO ==========
    Route::get('/inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('/inventory/{user}', [InventoryController::class, 'userInventory'])->name('inventory.show');
    Route::get('/inventory/{user}/sale', [InventoryController::class, 'userInSale'])->name('inventory.sale');
    Route::get('/my-inventory/sale', [InventoryController::class, 'showInventoryInSale'])->name('inventory.my-sale');

    // ========== RUTAS DE MAZOS ==========
    Route::get('/decks', [DeckController::class, 'index'])->name('decks.index');
    Route::post('/decks', [DeckController::class, 'store'])->name('decks.store');
    Route::get('/decks/{id}', [DeckController::class, 'show'])->name('decks.show');
    Route::get('/decks/explore/all', [DeckController::class, 'explore'])->name('decks.explore');
    Route::get('/decks/for-sale/listings', [DeckController::class, 'forSale'])->name('decks.for-sale');
    Route::get('/decks/user/{userId}', [DeckController::class, 'userPublicDecks'])->name('decks.user.public');
    Route::post('/decks/{deckId}/cards', [DeckController::class, 'addCard'])->name('decks.cards.add');
    Route::delete('/decks/{deckId}/cards/{cardId}', [DeckController::class, 'removeCard'])->name('decks.cards.remove');

    // ========== RUTAS DE CARTAS ==========
    Route::get('/cards', [CardController::class, 'index'])->name('cards.index');
    Route::get('/cards/{id}', [CardController::class, 'show'])->name('cards.show');
    Route::get('/cards/search/query', [CardController::class, 'search'])->name('cards.search');
    Route::post('/cards/{id}/favorite', [CardController::class, 'addToFavorites'])->name('cards.favorite');
    Route::delete('/cards/{id}/favorite', [CardController::class, 'removeFromFavorites'])->name('cards.unfavorite');

    // ========== RUTAS DE CARD SETS ==========
    Route::get('/card-sets', [CardSetController::class, 'index'])->name('cardsets.index');
    Route::get('/card-sets/{id}', [CardSetController::class, 'show'])->name('cardsets.show');
    Route::get('/card-sets/{id}/cards', [CardSetController::class, 'getCards'])->name('cardsets.cards');

    // ========== RUTAS DE BOOSTER PACKS ==========
    Route::get('/packs', [PackController::class, 'index'])->name('packs.index');
    Route::get('/packs/{id}', [PackController::class, 'show'])->name('packs.show');

    // ========== RUTAS DE MERCADO ==========
    Route::get('/market', [MarketController::class, 'index'])->name('market.index');
    Route::get('/market/cards', [MarketController::class, 'listCards'])->name('market.cards.list');
    Route::post('/market/cards', [MarketController::class, 'createListing'])->name('market.cards.create');
    Route::get('/market/cards/{id}', [MarketController::class, 'showListing'])->name('market.cards.show');
    Route::patch('/market/cards/{id}', [MarketController::class, 'updateListing'])->name('market.cards.update');
    Route::delete('/market/cards/{id}', [MarketController::class, 'deleteListing'])->name('market.cards.delete');
    Route::post('/market/cards/{id}/buy', [MarketController::class, 'buyCard'])->name('market.cards.buy');
    Route::get('/market/transactions', [TransactionController::class, 'index'])->name('market.transactions.index');
    Route::get('/market/transactions/{id}', [TransactionController::class, 'show'])->name('market.transactions.show');

    // ========== RUTAS DE INTERCAMBIOS ==========
    Route::get('/exchanges', [ExchangeController::class, 'index'])->name('exchanges.index');
    Route::post('/exchanges', [ExchangeController::class, 'create'])->name('exchanges.create');
    Route::get('/exchanges/{id}', [ExchangeController::class, 'show'])->name('exchanges.show');
    Route::post('/exchanges/{id}/propose', [ExchangeController::class, 'proposeExchange'])->name('exchanges.propose');
    Route::post('/exchanges/{id}/accept', [ExchangeController::class, 'acceptExchange'])->name('exchanges.accept');
    Route::post('/exchanges/{id}/reject', [ExchangeController::class, 'rejectExchange'])->name('exchanges.reject');

    // ========== RUTAS DE TRADES ==========
    Route::get('/trades', [TradeController::class, 'index'])->name('trades.index');
    Route::post('/trades', [TradeController::class, 'create'])->name('trades.create');
    Route::get('/trades/{id}', [TradeController::class, 'show'])->name('trades.show');
    Route::post('/trades/{id}/accept', [TradeController::class, 'accept'])->name('trades.accept');
    Route::post('/trades/{id}/reject', [TradeController::class, 'reject'])->name('trades.reject');
    Route::post('/trades/{id}/cancel', [TradeController::class, 'cancel'])->name('trades.cancel');

    // ========== RUTAS DE FORO ==========
    Route::get('/forum', [ForumController::class, 'index'])->name('forum.index');
    Route::get('/forum/categories', [ForumController::class, 'categories'])->name('forum.categories');
    Route::get('/forum/category/{categoryId}', [ForumController::class, 'showCategory'])->name('forum.category.show');
    Route::post('/forum/threads', [ForumController::class, 'createThread'])->name('forum.threads.create');

    // ========== RUTAS DE THREADS ==========
    Route::get('/threads', [ThreadController::class, 'index'])->name('threads.index');
    Route::get('/threads/{id}', [ThreadController::class, 'show'])->name('threads.show');
    Route::patch('/threads/{id}', [ThreadController::class, 'update'])->name('threads.update');
    Route::delete('/threads/{id}', [ThreadController::class, 'delete'])->name('threads.delete');
    Route::post('/threads/{id}/pin', [ThreadController::class, 'pin'])->name('threads.pin');
    Route::post('/threads/{id}/lock', [ThreadController::class, 'lock'])->name('threads.lock');

    // ========== RUTAS DE COMENTARIOS ==========
    Route::post('/comments', [CommentController::class, 'store'])->name('comments.store');
    Route::patch('/comments/{id}', [CommentController::class, 'update'])->name('comments.update');
    Route::delete('/comments/{id}', [CommentController::class, 'delete'])->name('comments.delete');
    Route::post('/comments/{id}/like', [CommentController::class, 'like'])->name('comments.like');

    // ========== RUTAS DE PERFIL SOCIAL ==========
    Route::get('/profile/{userId}', [SocialProfileController::class, 'show'])->name('social.profile.show');
    Route::get('/profile/{userId}/followers', [SocialProfileController::class, 'followers'])->name('social.followers');
    Route::get('/profile/{userId}/following', [SocialProfileController::class, 'following'])->name('social.following');
    Route::post('/profile/{userId}/follow', [SocialProfileController::class, 'follow'])->name('social.follow');
    Route::delete('/profile/{userId}/follow', [SocialProfileController::class, 'unfollow'])->name('social.unfollow');

    // ========== RUTAS DE BÚSQUEDA ==========
    Route::get('/search', [SearchController::class, 'index'])->name('search.index');
    Route::get('/search/cards', [SearchController::class, 'searchCards'])->name('search.cards');
    Route::get('/search/users', [SearchController::class, 'searchUsers'])->name('search.users');
    Route::get('/search/decks', [SearchController::class, 'searchDecks'])->name('search.decks');
    Route::get('/search/all', [SearchController::class, 'searchAll'])->name('search.all');

    // ========== RUTAS DE COOKIES ==========
    Route::post('/cookies/accept', [CookieController::class, 'accept'])->name('cookies.accept');
    Route::post('/cookies/decline', [CookieController::class, 'decline'])->name('cookies.decline');
});

Route::get('/marketplace', [MarketplaceController::class, 'index'])->name('marketplace.index');

        // ========== RUTAS DE TIENDA ==========
    Route::get('/shop', [catalogController::class, 'index'])->name('shop.index');

require __DIR__.'/settings.php';
