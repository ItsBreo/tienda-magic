<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Modelos
use App\Models\User;

// Importaciones de Controladores
use App\Http\Controllers\Shop\{CatalogController, CartController, PackOpeningController, PackDetailController, DepositController};
use App\Http\Controllers\Inventory\{InventoryController, DeckController, WalletTransactionController};
use App\Http\Controllers\User\{UserController, LoginController, RegisterController, UserProfileController};
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Card\{CardController, CardSetController, PackController};
use App\Http\Controllers\Market\{MarketController, TransactionController};
use App\Http\Controllers\Exchange\{ExchangeController, TradeController};
use App\Http\Controllers\Social\{ForumController, ThreadController, CommentController, ProfileController as SocialProfileController};
use App\Http\Controllers\SearchController;
use App\Http\Controllers\CookieController;
use App\Http\Controllers\Api\SetController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\StripeWebhookController;

// Controladores de Admin
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminRoleController;
use App\Http\Controllers\Admin\AdminSetController;
use App\Http\Controllers\Admin\AdminCardController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas
|--------------------------------------------------------------------------
*/

// Autenticación (Requiere middleware 'web' para soporte de sesiones/cookies)
Route::middleware('web')->group(function () {
    Route::post('/login', [LoginController::class, 'store'])->middleware('throttle:6,1')->name('login.store');
    Route::post('/register', [RegisterController::class, 'store'])->name('register.store');
});

// Tienda y Catálogo
Route::get('/shop', [CatalogController::class, 'index']);
Route::get('/shop-debug', function () {
    $packs = \App\Models\BoosterPack::with('cardSet')->paginate(6);
    return response()->json([
        'debug_info' => [
            'total_items' => $packs->total(),
            'per_page' => $packs->perPage(),
            'current_page' => $packs->currentPage(),
            'last_page' => $packs->lastPage(),
            'has_more_pages' => $packs->hasMorePages(),
        ],
        'pagination_data' => [
            'data' => $packs->items(),
            'current_page' => $packs->currentPage(),
            'last_page' => $packs->lastPage(),
            'total' => $packs->total(),
            'per_page' => $packs->perPage(),
        ]
    ]);
});
Route::get('/pack/{code}', [PackDetailController::class, 'show']);
Route::get('/packs', [PackController::class, 'index']);
Route::get('/packs/{id}', [PackController::class, 'show']);
Route::get('/cards/set/{setCode}', [PackController::class, 'getCardsBySet']);

// --- RUTAS DEL DASHBOARD ---
Route::get('/sets/latest', [SetController::class, 'latest']);
Route::get('/store-stats', [DashboardController::class, 'getStats']);

// --- PERFILES PÚBLICOS ---
Route::get('/profile/{userId}', [UserProfileController::class, 'show']); // Ver el perfil de otro usuario

// --- WEBHOOKS DE STRIPE (Sin autenticación) ---
Route::post('/webhooks/stripe', [StripeWebhookController::class, 'handleWebhook']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren Token/Sesión)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {

    // ========== AUTH CHECK — usada por AuthContext en cada reload ==========
    // ApiService.checkAuth() llama a GET /api/user → debe existir aquí
    Route::get('/user', [UserController::class, 'show']);

    // ========== PERFIL DE USUARIO JWT ==========
    Route::get('/user-profile', [UserController::class, 'show']); // alias mantenido por compatibilidad

    Route::post('/logout', [LoginController::class, 'destroy']);

    // ========== TIENDA & CARRITO ==========
    Route::post('/cart', [CartController::class, 'store']);
    Route::get('/cart', [CartController::class, 'index']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);

    // ========== CHECKOUT ==========
    Route::post('/checkout/process', [\App\Http\Controllers\Api\CheckoutController::class, 'processCheckout']);

    // ========== WALLET RECARGA ==========
    Route::post('/wallet/recharge', [\App\Http\Controllers\Api\WalletController::class, 'createRechargeSession']);

    // ========== BILLETERA ==========
    Route::post('/wallet/deposit', [DepositController::class, 'store']);

    // ========== USUARIO (Cuenta Base y Billetera) ==========
    // Prefijo /account para no colisionar con GET /user de checkAuth
    Route::prefix('account')->group(function () {
        Route::get('/', [UserController::class, 'show']);
        Route::patch('/password', [UserController::class, 'updatePassword']);
        Route::delete('/', [UserController::class, 'destroyUser']);
        Route::get('/balance', [UserController::class, 'getBalance']);
        Route::get('/decks', [UserController::class, 'showDecks']);
        Route::get('/favorites', [UserController::class, 'showFavoriteCards']);
        Route::get('/transactions', [UserController::class, 'transactions']);
    });

    // ========== PERFIL DE USUARIO (Avatar, Bio, País) ==========
    Route::prefix('profile')->group(function () {
        Route::get('/', [UserProfileController::class, 'showProfile']); // Obtener mi perfil
        Route::post('/', [UserProfileController::class, 'store']); // Crear mi perfil
        Route::patch('/', [UserProfileController::class, 'update']); // Actualizar mi perfil
        Route::patch('/public-info', [UserProfileController::class, 'updatePublicInfo']); // Actualizar solo info pública
        Route::delete('/', [UserProfileController::class, 'destroy']); // Borrar mi perfil
    });

    // ========== INVENTARIO & MAZOS ==========
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::get('/inventory/{user}', [InventoryController::class, 'userInventory']);

    Route::prefix('decks')->group(function () {
        Route::get('/', [DeckController::class, 'index']);
        Route::post('/', [DeckController::class, 'store']);
        Route::get('/{id}', [DeckController::class, 'show']);
        Route::post('/{deckId}/cards', [DeckController::class, 'addCard']);
        Route::delete('/{deckId}/cards/{cardId}', [DeckController::class, 'removeCard']);
    });

    // ========== MERCADO & CARTAS ==========
    Route::prefix('market')->group(function () {
        Route::get('/', [MarketController::class, 'index']);
        Route::post('/cards', [MarketController::class, 'createListing']);
        Route::post('/cards/{id}/buy', [MarketController::class, 'buyCard']);
        Route::get('/transactions', [TransactionController::class, 'index']);
    });

    Route::prefix('cards')->group(function () {
        Route::get('/', [CardController::class, 'index']);
        Route::get('/{id}', [CardController::class, 'show']);
        Route::post('/{id}/favorite', [CardController::class, 'addToFavorites']);
        Route::delete('/{id}/favorite', [CardController::class, 'removeFromFavorites']);
    });

    // ========== SOCIAL & FORO ==========
    Route::prefix('forum')->group(function () {
        Route::get('/', [ForumController::class, 'index']);
        Route::get('/categories', [ForumController::class, 'categories']);
        Route::post('/threads', [ForumController::class, 'createThread']);
    });

    Route::post('/comments', [CommentController::class, 'store']);
    Route::patch('/comments/{id}', [CommentController::class, 'update']);
    Route::delete('/comments/{id}', [CommentController::class, 'delete']);

    // ========== BÚSQUEDA ==========
    Route::get('/search/all', [SearchController::class, 'searchAll']);

    // ========== ADMIN DASHBOARD ==========
    Route::prefix('admin')->middleware(['admin'])->group(function () {
        Route::apiResource('users', AdminUserController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('roles', AdminRoleController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('sets', AdminSetController::class)->only(['index', 'store', 'destroy']);
        Route::apiResource('cards', AdminCardController::class)->only(['index', 'store', 'destroy']);

        // El Admin puede subir o bajar la reputación de los usuarios a mano
        Route::patch('/users/{userId}/reputation', [UserProfileController::class, 'updateReputation']);
    });
});
