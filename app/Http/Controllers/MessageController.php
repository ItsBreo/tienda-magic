<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMessageRequest;
use App\Http\Resources\MessageResource;
use App\Models\Conversation;
use App\Models\Message;
use App\Events\MessageSent;
use App\Services\ProfanityFilter;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class MessageController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request, Conversation $conversation): AnonymousResourceCollection
    {
        // Verificar que el usuario pertenece a la conversación
        if (!$conversation->users()->where('user_id', auth()->id())->exists()) {
            abort(403, 'No perteneces a esta conversación.');
        }

        $messages = $conversation->messages()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return MessageResource::collection($messages);
    }

    public function store(StoreMessageRequest $request, Conversation $conversation): MessageResource
    {
        $this->authorize('participate', $conversation);

        // Limpiar contenido de palabras ofensivas
        $cleanContent = ProfanityFilter::clean($request->validated()['content']);

        $message = $conversation->messages()->create([
            'user_id' => Auth::id(),
            'content' => $cleanContent,
            'type' => $request->validated()['type'] ?? 'text',
            'metadata' => $request->validated()['metadata'] ?? null,
        ]);

        $message->load('user');

        // Log para rastrear el broadcast
        Log::info('🔥 Intentando hacer broadcast del mensaje', ['id' => $message->id]);

        // Disparar evento de broadcasting después de guardar y limpiar
        broadcast(new MessageSent($message, $conversation))->toOthers();

        return new MessageResource($message);
    }

    public function update(StoreMessageRequest $request, Message $message): MessageResource
    {
        $this->authorize('update', $message);

        // Limpiar contenido de palabras ofensivas
        $cleanContent = ProfanityFilter::clean($request->validated()['content']);

        $message->update([
            'content' => $cleanContent,
            'metadata' => $request->validated()['metadata'] ?? null,
        ]);

        $message->markAsEdited();
        $message->load('user');

        return new MessageResource($message);
    }

    public function destroy(Message $message): \Illuminate\Http\Response
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->noContent();
    }
}
