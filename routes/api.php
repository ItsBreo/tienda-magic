<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Importaciones de Controladores
use App\Http\Controllers\Shop\{CatalogController, CartController, CheckoutController, PackOpeningController, PackDetailController, DepositController};
use App\Http\Controllers\Inventory\{InventoryController, DeckController, WalletTransactionController};
use App\Http\Controllers\User\{UserController, LoginController, RegisterController, UserProfileController};
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Card\{CardController, CardSetController, PackController};
use App\Http\Controllers\Market\{MarketController, TransactionController};
use App\Http\Controllers\Exchange\{ExchangeController, TradeController};
use App\Http\Controllers\Social\{ForumController, ThreadController, CommentController, ProfileController as SocialProfileController};
use App\Http\Controllers\SearchController;
use App\Http\Controllers\CookieController;

/*
|--------------------------------------------------------------------------
| Rutas Públicas
|--------------------------------------------------------------------------
*/

// Autenticación (Si no usas Fortify/Sanctum de forma externa)
Route::post('/login', [LoginController::class, 'store']);
Route::post('/register', [RegisterController::class, 'store']);

// Tienda y Catálogo
Route::get('/shop', [CatalogController::class, 'index']);
Route::get('/pack/{code}', [PackDetailController::class, 'show']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren Token/Sesión)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [LoginController::class, 'destroy']);

    // ========== USUARIO & BILLETERA ==========
    Route::prefix('user')->group(function () {
        Route::get('/', [UserController::class, 'show']); //
        Route::patch('/', [UserController::class, 'updateProfile']); //
        Route::patch('/password', [UserController::class, 'updatePassword']); //
        Route::delete('/', [UserController::class, 'destroyUser']); //
        Route::get('/balance', [UserController::class, 'getBalance']); //
        Route::get('/decks', [UserController::class, 'showDecks']); //
        Route::get('/favorites', [UserController::class, 'showFavoriteCards']); //
        Route::get('/transactions', [UserController::class, 'transactions']); //
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
});
Route::get('/store-stats', function () {

    // 1. Obtenemos el total de cartas de Scryfall (¡Y lo guardamos en caché por 24 horas!)
    // Usamos el catálogo de nombres únicos de Scryfall que es rapidísimo.
    $totalCards = Cache::remember('scryfall_total_cards', 60 * 60 * 24, function () {
        try {
            // Llamamos a la API de Scryfall
            $response = Http::timeout(5)->get('https://api.scryfall.com/catalog/card-names');

            if ($response->successful()) {
                // Scryfall devuelve un campo "total_values" con el número exacto de cartas únicas
                return $response->json('total_values');
            }
            return 30000; // Un número por defecto si la API de Scryfall falla temporalmente
        } catch (\Exception $e) {
            Log::error('Error conectando a Scryfall: ' . $e->getMessage());
            return 30000;
        }
    });

    // 2. Devolvemos los datos a React mezclando Scryfall con tu base de datos local
    return response()->json([
        'totalPacks' => 420, // (Tus packs locales)
        'totalCards' => $totalCards, // 🚀 ¡El número real de Scryfall!
        'activeUsers' => User::count(), // Tus usuarios reales
        'todaySales' => 15, // (Tus ventas locales)
    ]);
});
