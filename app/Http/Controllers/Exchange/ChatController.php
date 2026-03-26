<?php

namespace App\Http\Controllers\Exchange;

use App\Events\MessageSent;
use App\Http\Controllers\Controller;
use App\Models\ChatMessage;
use App\Models\TradeSession;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ChatController extends Controller
{
    // GET /api/trade/{id}/chat — cargar historial
    public function index($tradeSessionId)
    {
        $session = TradeSession::findOrFail($tradeSessionId);

        abort_if(!$session->isMember(Auth::id()), 403, 'No formas parte de este intercambio.');

        $messages = ChatMessage::where('trade_session_id', $tradeSessionId)
            ->with('user:id,username')
            ->orderBy('created_at')
            ->get();

        return response()->json($messages);
    }

    // POST /api/trade/{id}/chat — enviar mensaje
    public function store(Request $request, $tradeSessionId)
    {
        $session = TradeSession::findOrFail($tradeSessionId);

        abort_if(!$session->isMember(Auth::id()), 403, 'No formas parte de este intercambio.');

        abort_if(
            !in_array($session->status, ['pending', 'active']),
            422,
            'No puedes enviar mensajes en una sesión cerrada.'
        );

        $validated = $request->validate([
            'message' => 'required|string|max:500',
        ]);

        $message = ChatMessage::create([
            'trade_session_id' => $tradeSessionId,
            'user_id'          => Auth::id(),
            'message'          => $validated['message'],
        ]);

        $message->load('user:id,username');

        broadcast(new MessageSent($message)); // <-- Sin el toOthers() para probar

        \Log::info('Broadcast disparado', [
        'session_id' => $tradeSessionId,
        'user_id'    => Auth::id(),
        'message'    => $message->message,
        ]);

        return response()->json($message, 201);
    }
}
