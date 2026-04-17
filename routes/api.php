<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Broadcast;

// Modelos
use App\Models\User;

// Importaciones de Controladores
use App\Http\Controllers\Shop\{CatalogController, CartController, CheckoutController, PackOpeningController, PackDetailController, DepositController, InvoiceController};
use App\Http\Controllers\Inventory\{InventoryController, DeckController, WalletTransactionController};
use App\Http\Controllers\User\{UserController, LoginController, RegisterController, UserProfileController};
use App\Http\Controllers\Settings\ProfileController as SettingsProfileController;
use App\Http\Controllers\Card\{CardController, CardSetController, PackController};
use App\Http\Controllers\Market\{MarketController, TransactionController};
use App\Http\Controllers\Exchange\{ExchangeController, TradeController};
use App\Http\Controllers\Forum\{ForumController, ThreadController, CommentController, ProfileController as SocialProfileController};
use App\Http\Controllers\Forum\{VoteController, SavedThreadController};
use App\Http\Controllers\SearchController;
use App\Http\Controllers\CookieController;
use App\Http\Controllers\Api\SetController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\ConversationController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\Api\StripeWebhookController;

// Controladores de Admin
use App\Http\Controllers\Admin\AdminUserController;
use App\Http\Controllers\Admin\AdminRoleController;
use App\Http\Controllers\Admin\AdminSetController;
use App\Http\Controllers\Admin\AdminCardController;
use App\Http\Controllers\Admin\AdminBoosterPackController;
use App\Http\Controllers\Admin\AdminForumModController;
use App\Http\Controllers\Admin\AdminPermissionController;
use App\Http\Controllers\Admin\AdminAuditLogController;

// Controladores de Torneos
use App\Http\Controllers\Tournament\TournamentController;
use App\Http\Controllers\Tournament\TournamentRegistrationController;

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

// --- PERFILES PÚBLICOS ---
Route::get('/profile/{userId}', [UserProfileController::class, 'show']);

// --- WEBHOOKS DE STRIPE (Sin autenticación) ---
Route::post('/webhook/stripe', [StripeWebhookController::class, 'handleWebhook']);

/*
|--------------------------------------------------------------------------
| Rutas Protegidas (Requieren Token/Sesión)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:api')->group(function () {

    // ========== TRADE TEST (desarrollo) ==========
    Route::get('/users/list', function (\Illuminate\Http\Request $request) {
        return \App\Models\User::where('id', '!=', $request->user()->id)
            ->select('id', 'username', 'email')
            ->limit(20)
            ->get();
    });

    Route::post('/trade/start', function (\Illuminate\Http\Request $request) {
        $myId       = $request->user()->id;
        $receiverId = $request->receiver_id;

        $existing = \App\Models\TradeSession::where('status', 'active')
            ->where(function ($q) use ($myId, $receiverId) {
                $q->where('proposer_id', $myId)->where('receiver_id', $receiverId);
            })
            ->orWhere(function ($q) use ($myId, $receiverId) {
                $q->where('proposer_id', $receiverId)->where('receiver_id', $myId);
            })
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $session = \App\Models\TradeSession::create([
            'proposer_id' => $myId,
            'receiver_id' => $receiverId,
            'status'      => 'active',
            'expires_at'  => now()->addHours(24),
        ]);

        return response()->json($session, 201);
    });


Route::post('/broadcasting/auth', function (\Illuminate\Http\Request $request) {
        $channelName = $request->channel_name;
        $socketId = $request->socket_id;
        $userId = $request->user()?->id;

        // 1. Validar autorización manualmente según el canal
        $isAuthorized = false;
        if (preg_match('/^private-trade\.(\d+)$/', $channelName, $matches)) {
            $session = \App\Models\TradeSession::find($matches[1]);
            $isAuthorized = $session && $session->isMember($userId);
        } elseif (preg_match('/^private-App\.Models\.User\.(\d+)$/', $channelName, $matches)) {
            $isAuthorized = ((int) $matches[1] === (int) $userId);
        } elseif (preg_match('/^private-conversation\.([a-f0-9-]{36})$/', $channelName, $matches)) {
            // Conversaciones: permitir acceso si usuario está autenticado
            $isAuthorized = $userId !== null;
        }

        if (!$isAuthorized) {
            return response()->json(['message' => 'No autorizado para este canal'], 403);
        }

        // 2. Generar la firma criptográfica para Reverb explícitamente
        $secret = config('broadcasting.connections.reverb.secret');
        $key = config('broadcasting.connections.reverb.key');

        $signature = hash_hmac('sha256', $socketId . ':' . $channelName, $secret);

        return response()->json(['auth' => $key . ':' . $signature]);
    });

    // ========== AUTH CHECK — usada por AuthContext en cada reload ==========
    Route::get('/user', [UserController::class, 'show']);

    // ========== PERFIL DE USUARIO JWT ==========
    Route::get('/user-profile', [UserController::class, 'show']);
    Route::post('/logout', [LoginController::class, 'destroy']);

    // ========== TIENDA & CARRITO ==========
    Route::post('/cart', [CartController::class, 'store']);
    Route::get('/cart', [CartController::class, 'index']);
    Route::put('/cart/{id}', [CartController::class, 'update']);
    Route::delete('/cart/{id}', [CartController::class, 'destroy']);

    // ========== CHECKOUT ==========
    Route::post('/checkout/process', [\App\Http\Controllers\Api\CheckoutController::class, 'processCheckout']);
    Route::post('/checkout/verify', [\App\Http\Controllers\Api\CheckoutController::class, 'verifyStripeSession']);
    Route::post('/checkout', [CheckoutController::class, 'processFakeCheckout']);

    // ========== WALLET RECARGA ==========
    Route::post('/wallet/recharge', [\App\Http\Controllers\Api\WalletController::class, 'createRechargeSession']);
    // Descarga de facturas
    Route::get('/orders/{id}/invoice', [InvoiceController::class, 'download']);

    // ========== BILLETERA ==========
    Route::post('/wallet/deposit', [DepositController::class, 'store']);
    Route::get('/wallet/transactions', [WalletTransactionController::class, 'index']);
    Route::get('/wallet/transactions/pdf', [WalletTransactionController::class, 'downloadPdf']);

    // ========== USUARIO (Cuenta Base y Billetera) ==========
    Route::prefix('account')->group(function () {
        Route::get('/', [UserController::class, 'show']);
        Route::patch('/password', [UserController::class, 'updatePassword']);
        Route::delete('/', [UserController::class, 'destroyUser']);
        Route::get('/balance', [UserController::class, 'getBalance']);
        Route::get('/decks', [UserController::class, 'showDecks']);
        Route::get('/favorites', [UserController::class, 'showFavoriteCards']);
        Route::get('/transactions', [UserController::class, 'transactions']);
    });

    // ========== LOGROS ==========
    Route::get('/achievements', [\App\Http\Controllers\User\AchievementController::class, 'index']);

    // ========== PERFIL DE USUARIO (Avatar, Bio, País) ==========
    Route::prefix('profile')->group(function () {
        Route::get('/', [UserProfileController::class, 'showProfile']);
        Route::post('/', [UserProfileController::class, 'store']);
        Route::patch('/', [UserProfileController::class, 'update']);
        Route::patch('/public-info', [UserProfileController::class, 'updatePublicInfo']);
        Route::delete('/', [UserProfileController::class, 'destroy']);
    });

    // ========== INVENTARIO & MAZOS ==========
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::get('/inventory/{user}', [InventoryController::class, 'userInventory']);
    Route::post('/inventory/packs/{id}/open', [\App\Http\Controllers\Inventory\PackOpeningController::class, 'open']);

    Route::prefix('decks')->group(function () {
        Route::get('/', [DeckController::class, 'index']);
        Route::post('/', [DeckController::class, 'store']);
        Route::get('/{id}', [DeckController::class, 'show']);
        Route::post('/{deckId}/cards', [DeckController::class, 'addCard']);
        Route::delete('/{deckId}/cards/{cardId}', [DeckController::class, 'removeCard']);
    });

    // ========== EXCHANGES / INTERCAMBIOS ==========
    Route::prefix('exchanges')->group(function () {
        Route::get('/', [ExchangeController::class, 'index']);
        Route::post('/', [ExchangeController::class, 'store']);
        Route::post('/{id}/request', [ExchangeController::class, 'requestExchange']);
    });

    Route::prefix('exchange-requests')->group(function () {
        Route::get('/', [TradeController::class, 'myRequests']);
        Route::post('/{id}/accept', [TradeController::class, 'acceptRequest']);
        Route::post('/{id}/reject', [TradeController::class, 'rejectRequest']);
    });

    Route::prefix('trade-sessions')->group(function () {
        Route::get('/{id}', [TradeController::class, 'showRoom']);
        Route::post('/{id}/confirm', [TradeController::class, 'confirmTrade']);
        Route::post('/{id}/cancel', [TradeController::class, 'cancelTrade']);
        Route::post('/{id}/change-card', [TradeController::class, 'changeCard']);
        // Chat de la sala
        Route::get('/{id}/messages', [TradeController::class, 'getMessages']);
        Route::post('/{id}/messages', [TradeController::class, 'sendMessage']);
        Route::post('/{id}/chat', [TradeController::class, 'getOrCreateChat']);
    });

    // ========== MERCADO & CARTAS ==========
    Route::prefix('market')->group(function () {
        Route::get('/', [MarketController::class, 'index']);
        Route::post('/cards', [MarketController::class, 'store']); // Listing general
        Route::get('/product/{type}/{id}', [MarketController::class, 'show']);
        Route::post('/cards/{id}/initiate-purchase', [MarketController::class, 'initiatePurchase']);
        Route::post('/cards/{id}/cancel', [MarketController::class, 'cancelListing']);
        Route::get('/my-listings', [MarketController::class, 'myListings']);
        Route::get('/price-history/{type}/{id}', [MarketController::class, 'getPriceHistory']);
        
        Route::get('/transactions', [TransactionController::class, 'index']);
        Route::get('/transactions/my', [TransactionController::class, 'myTransactions']);
    });

    Route::prefix('cards')->group(function () {
        Route::get('/', [CardController::class, 'index']);
        Route::get('/{id}', [CardController::class, 'show']);
        Route::post('/{id}/favorite', [CardController::class, 'addToFavorites']);
        Route::delete('/{id}/favorite', [CardController::class, 'removeFromFavorites']);
    });

    // ========== SOCIAL & FORO ==========

    // Foro (Lectura autenticada)
    Route::get('/forums', [ForumController::class, 'index']);
    Route::get('/forums/{forum}', [ForumController::class, 'show']);
    Route::get('/threads', [ThreadController::class, 'index']);
    Route::get('/forum/search', [ThreadController::class, 'search']);
    Route::get('/threads/{thread}', [ThreadController::class, 'show']);

    // Threads (escritura privada)
    Route::post('/threads', [ThreadController::class, 'store']);
    Route::put('/threads/{thread}', [ThreadController::class, 'update']);
    Route::delete('/threads/{thread}', [ThreadController::class, 'destroy']);

    // Comentarios
    Route::post('/threads/{thread}/comments', [CommentController::class, 'store']);
    Route::put('/comments/{comment}', [CommentController::class, 'update']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);

    // Votos (threads y comentarios — polimórfico)
    Route::post('/votes', [VoteController::class, 'store']);

    // Guardados
    Route::get('/saved', [SavedThreadController::class, 'index']);
    Route::post('/saved/{thread}', [SavedThreadController::class, 'store']);
    Route::delete('/saved/{thread}', [SavedThreadController::class, 'destroy']);

    // ========== TORNEOS ==========
    // Públicas (autenticado)
    Route::get('/tournaments',          [TournamentController::class, 'index']);
    Route::get('/tournaments/{tournament}', [TournamentController::class, 'show']);

    // CRUD (Administrativo)
    Route::post('/tournaments',             [TournamentController::class, 'store'])
        ->middleware('permission:manage-tournaments');
    Route::patch('/tournaments/{tournament}', [TournamentController::class, 'update'])
        ->middleware('permission:manage-tournaments');
    Route::delete('/tournaments/{tournament}', [TournamentController::class, 'destroy'])
        ->middleware('permission:manage-tournaments');

    // Inscripciones (Públicas para registro propio)
    Route::post('/tournaments/{tournament}/register',   [TournamentController::class, 'register']);
    Route::delete('/tournaments/{tournament}/register', [TournamentController::class, 'unregister']);

    // Gestión de inscripciones (Administrativo)
    Route::get('/tournaments/{tournament}/registrations',                          [TournamentController::class, 'registrations'])
        ->middleware('permission:manage-tournaments');
    Route::patch('/tournaments/{tournament}/registrations/{registration}/confirm', [TournamentController::class, 'confirmRegistration'])
        ->middleware('permission:manage-tournaments');

    // ========== BÚSQUEDA ==========
    Route::get('/search/all', [SearchController::class, 'searchAll']);

    // ========== CONVERSATIONS & CHAT ==========
    Route::prefix('conversations')->middleware('auth:api')->group(function () {
        Route::get('/', [ConversationController::class, 'index']);
        Route::post('/', [ConversationController::class, 'store']);
        Route::get('/{conversation}', [ConversationController::class, 'show']);

        Route::prefix('/{conversation}/messages')->group(function () {
            Route::get('/', [MessageController::class, 'index']);
            Route::post('/', [MessageController::class, 'store']);
        });
    });

    // ========== TRADES ==========
    Route::get('/trades', [\App\Http\Controllers\TradeController::class, 'index'])->middleware('auth:api');
    Route::post('/trades/test', [\App\Http\Controllers\TradeController::class, 'storeTest'])->middleware('auth:api');

    // ========== TRADES CHAT ==========
    Route::post('/trades/{tradeId}/chat', [ConversationController::class, 'getOrCreateForTrade'])->middleware('auth:api');

    Route::prefix('messages')->middleware('auth:api')->group(function () {
        Route::patch('/{message}', [MessageController::class, 'update']);
        Route::delete('/{message}', [MessageController::class, 'destroy']);
    });

    // ========== ADMIN DASHBOARD ==========
    // Solo accesible por admin y super_admin (el middleware 'admin' hace el filtro base)
    // Pero ahora añadimos permisos granulares para control total
    Route::prefix('admin')->middleware(['admin'])->group(function () {
        // Estadísticas del Dashboard Administrativo
        Route::get('/stats', [DashboardController::class, 'getStats'])
             ->middleware('permission:manage-users');

        // Acciones masivas (Bulk) para sets, cartas, booster-packs, roles y usuarios
        Route::post('/users/bulk-delete', [AdminUserController::class, 'bulkDelete'])
            ->middleware('permission:manage-users');
        Route::post('/users/bulk-toggle-active', [AdminUserController::class, 'bulkToggleActive'])
            ->middleware('permission:manage-users');
        Route::post('/users/bulk-change-role', [AdminUserController::class, 'bulkChangeRole'])
            ->middleware('permission:assign-roles');

        Route::post('/roles/bulk-delete', [AdminRoleController::class, 'bulkDelete'])
            ->middleware('permission:manage-roles');

        Route::post('/sets/bulk-delete', [AdminSetController::class, 'bulkDelete'])
            ->middleware('permission:manage-sets');
        Route::post('/sets/bulk-toggle-active', [AdminSetController::class, 'bulkToggleActive'])
            ->middleware('permission:manage-sets');

        Route::post('/cards/bulk-delete', [AdminCardController::class, 'bulkDelete'])
            ->middleware('permission:manage-cards');
        Route::post('/cards/bulk-toggle-active', [AdminCardController::class, 'bulkToggleActive'])
            ->middleware('permission:manage-cards');

        Route::post('/booster-packs/bulk-delete', [AdminBoosterPackController::class, 'bulkDelete'])
            ->middleware('permission:manage-booster-packs');
        Route::post('/booster-packs/bulk-toggle-active', [AdminBoosterPackController::class, 'bulkToggleActive'])
            ->middleware('permission:manage-booster-packs');

        Route::apiResource('users', AdminUserController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:manage-users');

        Route::apiResource('roles', AdminRoleController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->middleware('permission:manage-roles');

        Route::get('/permissions', [AdminPermissionController::class, 'index'])
            ->middleware('permission:manage-roles');

        Route::apiResource('sets', AdminSetController::class)
            ->middleware('permission:manage-sets');

        Route::apiResource('cards', AdminCardController::class)
            ->middleware('permission:manage-cards');

        Route::apiResource('booster-packs', AdminBoosterPackController::class)
            ->middleware('permission:manage-booster-packs');

        Route::patch('/users/{userId}/reputation', [UserProfileController::class, 'updateReputation'])
            ->middleware('permission:manage-users');

        // Asignar / cambiar rol a un usuario (incluyendo forum_id para moderadores)
        Route::post('/users/{user}/assign-role', [AdminUserController::class, 'assignRole'])
            ->middleware('permission:assign-roles');

        // Logs del Sistema
        Route::get('/logs', [AdminAuditLogController::class, 'index'])
            ->middleware('permission:manage-users'); // Reutilizamos permiso o creamos uno nuevo
    });

    // ========== MODERACIÓN DEL FORO ==========
    // Accesible para admin, super_admin y cualquier moderador sectorial
    Route::prefix('mod')->middleware(['role:moderator'])->group(function () {
        // Acciones masivas para moderadores
        Route::post('/threads/bulk-delete', [AdminForumModController::class, 'bulkDeleteThreads'])
            ->middleware('permission:moderate-forum');
        Route::post('/comments/bulk-delete', [AdminForumModController::class, 'bulkDeleteComments'])
            ->middleware('permission:moderate-forum');

        // Ver threads de un foro
        Route::get('/forums/{forumId}/threads', [AdminForumModController::class, 'threads'])
            ->middleware('permission:moderate-forum');

        // Borrar contenido
        Route::delete('/threads/{thread}',   [AdminForumModController::class, 'deleteThread'])
            ->middleware('permission:moderate-forum');
        Route::delete('/comments/{comment}', [AdminForumModController::class, 'deleteComment'])
            ->middleware('permission:moderate-forum');

        // Restaurar contenido
        Route::post('/threads/{threadId}/restore',   [AdminForumModController::class, 'restoreThread'])
            ->middleware('permission:restore-content');
        Route::post('/comments/{commentId}/restore', [AdminForumModController::class, 'restoreComment'])
            ->middleware('permission:restore-content');
    });
});
