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

Broadcast::channel('trade.{sessionId}', function ($user, $sessionId) {
    $session = \App\Models\TradeSession::with('exchangeRequest.exchange')->find($sessionId);
    return $session && $session->isMember($user->id);
});
