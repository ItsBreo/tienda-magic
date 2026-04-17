<?php

namespace App\Http\Controllers\Exchange;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\ExchangeRequest;
use App\Models\TradeSession;
use App\Models\Conversation;
use App\Models\InventoryCard;
use App\Events\MessageSent;
use App\Services\ProfanityFilter;
use App\Notifications\TradeAcceptedNotification;
use App\Events\TradeSessionUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use App\Services\AuditLogger;
use OpenApi\Attributes as OA;

class TradeController extends Controller
{
    #[OA\Get(
        path: "/api/exchange-requests",
        summary: "Mis solicitudes de intercambio",
        description: "Obtiene las solicitudes enviadas, recibidas y el historial de completadas.",
        tags: ["Exchanges"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Listado de solicitudes")]
    public function myRequests()
    {
        $user = auth()->user();

        // Envíos: Los que yo pedí
        $sent = ExchangeRequest::with(['exchange.offeredCard.card', 'offeredCard.card', 'tradeSession'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        // Recibidos: Peticiones a mis exchanges
        $received = ExchangeRequest::with(['exchange.offeredCard.card', 'offeredCard.card', 'user', 'tradeSession'])
            ->whereHas('exchange', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        // Completados: Historial (yo pedí o me pidieron)
        $completed = ExchangeRequest::with(['exchange.offeredCard.card', 'offeredCard.card', 'user', 'exchange.user', 'tradeSession'])
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                      ->orWhereHas('exchange', function ($q) use ($user) {
                          $q->where('user_id', $user->id);
                      });
            })
            ->where('status', 'completed')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'sent' => $sent,
            'received' => $received,
            'completed' => $completed
        ]);
    }

    #[OA\Post(
        path: "/api/exchange-requests/{id}/accept",
        summary: "Aceptar solicitud de intercambio",
        description: "Acepta una petición a tu listado de intercambio y crea una sala de sesión.",
        tags: ["Exchanges"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la solicitud", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Solicitud aceptada y sesión creada")]
    public function acceptRequest($id)
    {
        $exchangeRequest = ExchangeRequest::with('exchange.user')->findOrFail($id);
        $user = auth()->user();

        if ($exchangeRequest->exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($exchangeRequest->status !== 'pending' || $exchangeRequest->exchange->status !== 'active') {
            return response()->json(['message' => 'El intercambio ya no está activo.'], 400);
        }

        DB::beginTransaction();
        try {
            $exchangeRequest->status = 'accepted';
            $exchangeRequest->save();

            $exchange = $exchangeRequest->exchange;
            $exchange->status = 'in_progress';
            $exchange->save();

            // Rechazar y desbloquear otras peticiones a este mismo exchange
            $otherRequests = ExchangeRequest::where('exchange_id', $exchange->id)
                ->where('id', '!=', $exchangeRequest->id)
                ->where('status', 'pending')
                ->get();

            foreach ($otherRequests as $or) {
                $or->status = 'rejected';
                $or->save();
                InventoryCard::where('id', $or->offered_inventory_card_id)->decrement('quantity_locked', 1);
            }

            $session = TradeSession::create([
                'exchange_request_id' => $exchangeRequest->id,
                'status' => 'active'
            ]);

            // Notify requester
            $exchangeRequest->user->notify(new TradeAcceptedNotification($exchangeRequest));

            DB::commit();
            return response()->json($session, 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    #[OA\Post(
        path: "/api/exchange-requests/{id}/reject",
        summary: "Rechazar solicitud de intercambio",
        description: "Rechaza una solicitud de intercambio que está pendiente.",
        tags: ["Exchanges"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la solicitud", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Solicitud rechazada correctamente")]
    public function rejectRequest($id)
    {
        $exchangeRequest = ExchangeRequest::with('exchange')->findOrFail($id);
        $user = auth()->user();

        if ($exchangeRequest->exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($exchangeRequest->status !== 'pending') {
            return response()->json(['message' => 'No puedes rechazar algo que no está pendiente.'], 400);
        }

        DB::beginTransaction();
        try {
            $exchangeRequest->status = 'rejected';
            $exchangeRequest->save();

            // Unlock req card
            InventoryCard::where('id', $exchangeRequest->offered_inventory_card_id)->decrement('quantity_locked', 1);

            DB::commit();
            return response()->json(['message' => 'Rechazado correctamente'], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error'], 500);
        }
    }

    #[OA\Get(
        path: "/api/trade-sessions/{id}",
        summary: "Ver sala de intercambio",
        description: "Obtiene los detalles y estado de una sesión de intercambio activa.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Datos de la sesión de intercambio")]
    public function showRoom($id)
    {
        $session = TradeSession::with([
            'exchangeRequest.user',
            'exchangeRequest.offeredCard.card',
            'exchangeRequest.exchange.user',
            'exchangeRequest.exchange.offeredCard.card'
        ])->findOrFail($id);

        $user = auth()->user();
        if ($session->exchangeRequest->user_id !== $user->id && $session->exchangeRequest->exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return response()->json($session);
    }

    #[OA\Post(
        path: "/api/trade-sessions/{id}/confirm",
        summary: "Confirmar intercambio",
        description: "Confirma el envío en la sesión de intercambio de tu lado. Cuando ambos confirman, se ejecuta el trueque.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Confirmación guardada y/o transacción ejecutada completa")]
    public function confirmTrade($id)
    {
        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        if ($session->status !== 'active') {
            return response()->json(['message' => 'La sesión no está activa'], 400);
        }

        $isUser1 = ($exchange->user_id === $user->id);
        $isUser2 = ($req->user_id === $user->id);

        if (!$isUser1 && !$isUser2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            if ($isUser1) {
                $session->user1_confirmed = true;
            } else {
                $session->user2_confirmed = true;
            }
            $session->save();

            // Si ambos confirmaron => Efectuar intercambio
            if ($session->user1_confirmed && $session->user2_confirmed) {
                // USER1 (exchange creator) gives his card to USER2
                // USER2 (req creator) gives his card to USER1

                $card1 = InventoryCard::findOrFail($exchange->offered_inventory_card_id);
                $card2 = InventoryCard::findOrFail($req->offered_inventory_card_id);

                $transferCard = function($fromCardRow, $newUserId) {
                    $fromCardRow->quantity_locked -= 1;
                    $fromCardRow->quantity -= 1;
                    if ($fromCardRow->quantity <= 0) {
                        $fromCardRow->delete();
                    } else {
                        $fromCardRow->save();
                    }

                    $newCardRow = InventoryCard::where('user_id', $newUserId)
                        ->where('card_id', $fromCardRow->card_id)
                        ->where('is_foil', $fromCardRow->is_foil)
                        ->where('condition', $fromCardRow->condition)
                        ->where('language', $fromCardRow->language)
                        ->first();
                        
                    if ($newCardRow) {
                        $newCardRow->increment('quantity', 1);
                    } else {
                        InventoryCard::create([
                            'user_id' => $newUserId,
                            'card_id' => $fromCardRow->card_id,
                            'quantity' => 1,
                            'is_foil' => $fromCardRow->is_foil,
                            'condition' => $fromCardRow->condition,
                            'language' => $fromCardRow->language
                        ]);
                    }
                };

                // Transfer card 1 to user2
                $transferCard($card1, $req->user_id);

                // Transfer card 2 to user1
                $transferCard($card2, $exchange->user_id);

                $session->status = 'completed';
                $session->save();

                $req->status = 'completed';
                $req->save();

                $exchange->status = 'completed';
                $exchange->save();

                // ---------- ACHIEVEMENT EVENTS ----------
                event(new \App\Events\TradeCompleted($exchange->user));
                event(new \App\Events\TradeCompleted($req->user));

                // ---------- AUDIT LOG ----------
                $timestamp = now()->format('Y-m-d_H-i-s');
                $creatorUsername = $exchange->user->username ?? $exchange->user->name ?? 'unknown';
                $creatorUsernameSafe = preg_replace('/[^A-Za-z0-9_]/', '', str_replace(' ', '_', $creatorUsername));
                $logFilename = "{$timestamp}_{$creatorUsernameSafe}.log";

                $logContent = "TRADE SESSION CONFIRMED\n";
                $logContent .= "===============================\n";
                $logContent .= "Date: " . now()->toDateTimeString() . "\n";
                $logContent .= "Session ID: {$session->id}\n";
                $logContent .= "Exchange ID: {$exchange->id}\n\n";

                $logContent .= "--- USER 1 (Creator) ---\n";
                $logContent .= "Name: {$exchange->user->name} (ID: {$exchange->user->id})\n";
                $logContent .= "Gave: {$card1->card->name} [{$card1->condition} / {$card1->language}]\n\n";

                $logContent .= "--- USER 2 (Requester) ---\n";
                $logContent .= "Name: {$req->user->name} (ID: {$req->user->id})\n";
                $logContent .= "Gave: {$card2->card->name} [{$card2->condition} / {$card2->language}]\n\n";

                $logContent .= "Status: COMPLETED\n";
                
                \Illuminate\Support\Facades\Storage::disk('local')->put("trade_logs/{$logFilename}", $logContent);

                // ---------- SYSTEM AUDIT LOG ----------
                AuditLogger::log('trade.completed', $session, [
                    'exchange_id' => $exchange->id,
                    'user1_id' => $exchange->user_id,
                    'user1_name' => $exchange->user->name,
                    'user2_id' => $req->user_id,
                    'user2_name' => $req->user->name,
                    'card1_name' => $card1->card->name,
                    'card2_name' => $card2->card->name,
                ]);
            }

            DB::commit();

            // Actualización en tiempo real vía WebSocket (Payload ligero para evitar 'Payload too large')
            broadcast(new TradeSessionUpdated((clone $session)->unsetRelations()))->toOthers();

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al confirmar: ' . $e->getMessage() . ' - File: ' . $e->getFile() . ' - Line: ' . $e->getLine()], 500);
        }
    }

    #[OA\Post(
        path: "/api/trade-sessions/{id}/cancel",
        summary: "Cancelar intercambio",
        description: "Cancela la sesión de intercambio desde la sala. Libera la oferta y reactiva el listado principal.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Sesión cancelada")]
    public function cancelTrade($id)
    {
        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        if ($session->status !== 'active') {
            return response()->json(['message' => 'La sesión no está activa o ya finalizó.'], 400);
        }

        $isUser1 = ($exchange->user_id === $user->id);
        $isUser2 = ($req->user_id === $user->id);

        if (!$isUser1 && !$isUser2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        DB::beginTransaction();
        try {
            $session->status = 'cancelled';
            $session->save();

            $req->status = 'cancelled';
            $req->save();

            // Desbloquear la carta de la oferta (jugador 2)
            InventoryCard::where('id', $req->offered_inventory_card_id)->decrement('quantity_locked', 1);

            // Reactivar el listado original propuesto por el jugador 1 en el mercado
            $exchange->status = 'active';
            $exchange->save();

            DB::commit();

            // Actualización en tiempo real vía WebSocket
            broadcast(new TradeSessionUpdated((clone $session)->unsetRelations()))->toOthers();

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al cancelar: ' . $e->getMessage()], 500);
        }
    }

    #[OA\Post(
        path: "/api/trade-sessions/{id}/change-card",
        summary: "Cambiar carta ofrecida",
        description: "Cambia la carta que ofreces en la sala de intercambio. Resetea las confirmaciones.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "new_inventory_card_id", type: "integer")
        ])
    )]
    #[OA\Response(response: 200, description: "Carta cambiada y confirmaciones reseteadas")]
    public function changeCard(Request $request, $id)
    {
        $request->validate([
            'new_inventory_card_id' => 'required|integer|exists:inventory_card,id'
        ]);

        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        if ($session->status !== 'active') {
            return response()->json(['message' => 'La sesión no está activa.'], 400);
        }

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        $isUser1 = ($exchange->user_id === $user->id);
        $isUser2 = ($req->user_id === $user->id);

        if (!$isUser1 && !$isUser2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $newInvCardId = $request->new_inventory_card_id;
        $invCard = InventoryCard::where('id', $newInvCardId)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $modelToUpdate = $isUser1 ? $exchange : $req;
        $oldInvCardId = $modelToUpdate->offered_inventory_card_id;

        if ($oldInvCardId == $newInvCardId) {
            return response()->json($session);
        }

        if ($invCard->quantity <= $invCard->quantity_locked) {
            return response()->json(['message' => 'No tienes cantidad disponible de esta carta.'], 400);
        }

        if ($isUser2 && $exchange->requested_card_id) {
            if ($invCard->card_id !== $exchange->requested_card_id) {
                $exchange->load('requestedCard');
                return response()->json(['message' => "El creador solicita específicamente la carta: {$exchange->requestedCard->name}"], 400);
            }
        }

        DB::beginTransaction();
        try {
            InventoryCard::where('id', $oldInvCardId)->decrement('quantity_locked', 1);
            $invCard->increment('quantity_locked', 1);

            $modelToUpdate->offered_inventory_card_id = $newInvCardId;
            $modelToUpdate->save();

            $session->user1_confirmed = false;
            $session->user2_confirmed = false;
            $session->save();

            DB::commit();

            $session->load([
                'exchangeRequest.user',
                'exchangeRequest.offeredCard.card',
                'exchangeRequest.exchange.user',
                'exchangeRequest.exchange.offeredCard.card'
            ]);
            broadcast(new TradeSessionUpdated((clone $session)->unsetRelations()))->toOthers();

            return response()->json($session);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Error al cambiar la carta: ' . $e->getMessage()], 500);
        }
    }


    #[OA\Post(
        path: "/api/trade-sessions/{id}/chat",
        summary: "Inicia y obtiene conversación",
        description: "Obtiene (o crea si no existe) la conversación asociada a esta sesión de intercambio.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "ID de conversación")]
    public function getOrCreateChat($id)
    {
        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        if ($req->user_id !== $user->id && $exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Buscar conversación existente ligada a esta trade session
        $conversation = Conversation::where('context_type', 'trade_session')
            ->where('context_id', $session->id)
            ->first();

        if (!$conversation) {
            $conversation = Conversation::create([
                'title'        => "Trade #{$session->id}",
                'type'         => 'direct',
                'context_type' => 'trade_session',
                'context_id'   => $session->id,
            ]);
        }

        // Asegurar que ambos participantes estén en la conversación
        $participantIds = [$req->user_id, $exchange->user_id];
        foreach ($participantIds as $pid) {
            if (!$conversation->users()->where('user_id', $pid)->exists()) {
                $conversation->users()->attach($pid, ['role' => 'participant']);
            }
        }

        return response()->json(['conversation_id' => $conversation->id]);
    }

    #[OA\Get(
        path: "/api/trade-sessions/{id}/messages",
        summary: "Obtener mensajes del chat de intercambio",
        description: "Recupera los mensajes del chat vinculados a esta sala de trade.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Listado de mensajes y ID de chat")]
    public function getMessages($id)
    {
        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        if ($req->user_id !== $user->id && $exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $conversation = Conversation::where('context_type', 'trade_session')
            ->where('context_id', $session->id)
            ->first();

        if (!$conversation) {
            return response()->json(['data' => [], 'conversation_id' => null]);
        }

        $messages = $conversation->messages()
            ->with('user:id,name,username')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn ($m) => [
                'id'         => $m->id,
                'content'    => $m->content,
                'user_id'    => $m->user_id,
                'user_name'  => $m->user->name ?? 'Usuario',
                'created_at' => $m->created_at->toIso8601String(),
            ]);

        return response()->json([
            'conversation_id' => $conversation->id,
            'data'            => $messages,
        ]);
    }

    #[OA\Post(
        path: "/api/trade-sessions/{id}/messages",
        summary: "Enviar mensaje al chat de intercambio",
        description: "Envía un nuevo mensaje al chat de la sala de intercambio.",
        tags: ["Trade Sessions"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "id", in: "path", required: true, description: "ID de la sesión", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "content", type: "string")
        ])
    )]
    #[OA\Response(response: 201, description: "Mensaje creado y emitido")]
    public function sendMessage(Request $request, $id)
    {
        $request->validate(['content' => 'required|string|max:1000']);

        $session = TradeSession::with('exchangeRequest.exchange')->findOrFail($id);
        $user = auth()->user();

        $req = $session->exchangeRequest;
        $exchange = $req->exchange;

        if ($req->user_id !== $user->id && $exchange->user_id !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Obtener o crear conversación
        $conversation = Conversation::firstOrCreate(
            ['context_type' => 'trade_session', 'context_id' => $session->id],
            ['title' => "Trade #{$session->id}", 'type' => 'direct']
        );

        // Asegurar participantes
        $participantIds = [$req->user_id, $exchange->user_id];
        foreach ($participantIds as $pid) {
            if (!$conversation->users()->where('user_id', $pid)->exists()) {
                $conversation->users()->attach($pid, ['role' => 'participant']);
            }
        }

        $cleanContent = ProfanityFilter::clean($request->content);

        $message = $conversation->messages()->create([
            'user_id' => $user->id,
            'content' => $cleanContent,
            'type'    => 'text',
        ]);

        $message->load('user:id,name,username');
        $conversation->updateLastMessageAt();

        broadcast(new MessageSent($message, $conversation))->toOthers();

        return response()->json([
            'id'         => $message->id,
            'content'    => $message->content,
            'user_id'    => $message->user_id,
            'user_name'  => $message->user->name ?? 'Usuario',
            'created_at' => $message->created_at->toIso8601String(),
        ], 201);
    }
}
