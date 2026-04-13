<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Log;
use App\Models\Conversation;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    // Conversaciones: permitir acceso si usuario está autenticado
    return $user !== null;
});

// LEGACY: Mantener temporalmente para compatibilidad con código antiguo
// Broadcast::channel('trade.{sessionId}', function ($user, $sessionId) {
//     $session = TradeSession::find($sessionId);
//
//     $isAuthorized = $session && $session->isMember($user->id);
//
//     Log::info("Intentando conectar a trade.{$sessionId} - Usuario: {$user->id} - Autorizado: " . ($isAuthorized ? 'SI' : 'NO'));
//
//     return $isAuthorized;
// });
