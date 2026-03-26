<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\TradeSession;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('trade.{sessionId}', function ($user, $sessionId) {
    $session = TradeSession::find($sessionId);

    $isAuthorized = $session && $session->isMember($user->id);

    // Log para verificar en storage/logs/laravel.log si React logra conectarse a este canal
    Log::info("Intentando conectar a trade.{$sessionId} - Usuario: {$user->id} - Autorizado: " . ($isAuthorized ? 'SI' : 'NO'));

    return $isAuthorized;
});
