<?php

namespace App\Http\Controllers;

use App\Models\Trade;
use App\Models\Conversation;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TradeController extends Controller
{
    /**
     * Obtener todos los trades del usuario autenticado
     */
    public function index(): JsonResponse
    {
        $userId = auth()->id();
        $trades = Trade::with(['sender', 'receiver', 'conversation'])
            ->where('sender_id', $userId)
            ->orWhere('receiver_id', $userId)
            ->get();

        return response()->json($trades);
    }

    /**
     * Crear un trade de prueba con el primer usuario disponible
     */
    public function storeTest(): JsonResponse
    {
        try {
            $sender = Auth::user();

            // Buscar el primer usuario que no sea el sender
            $receiver = User::where('id', '!=', $sender->id)->first();

            if (!$receiver) {
                return response()->json(['error' => 'No hay otros usuarios disponibles'], 404);
            }

            // Crear el trade dentro de una transacción
            $trade = DB::transaction(function () use ($sender, $receiver) {
                $trade = Trade::create([
                    'sender_id' => $sender->id,
                    'receiver_id' => $receiver->id,
                    'status' => 'pending',
                ]);

                // Crear la conversación asociada
                $conversation = Conversation::create([
                    'title' => "Trade #{$trade->id} - {$sender->name} ↔ {$receiver->name}",
                    'type' => 'trade',
                    'trade_id' => $trade->id,
                ]);

                // CRÍTICO: Adjuntar AMBOS usuarios a la conversación
                $conversation->users()->sync([$trade->sender_id, $trade->receiver_id]);

                return $trade->load(['sender', 'receiver', 'conversation']);
            });

            return response()->json($trade, 201);

        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear trade: ' . $e->getMessage()], 500);
        }
    }
}
