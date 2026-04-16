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
use OpenApi\Attributes as OA;

class MessageController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: "/api/conversations/{conversation}/messages",
        summary: "Obtener mensajes",
        description: "Obtiene los mensajes de una conversación.",
        tags: ["Messages"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "conversation", in: "path", required: true, description: "UUID de la conversación", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Lista de mensajes paginada")]
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

    #[OA\Post(
        path: "/api/conversations/{conversation}/messages",
        summary: "Enviar mensaje",
        description: "Envía un mensaje a una conversación.",
        tags: ["Messages"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "conversation", in: "path", required: true, description: "UUID de la conversación", schema: new OA\Schema(type: "string"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "content", type: "string"),
            new OA\Property(property: "type", type: "string", default: "text")
        ])
    )]
    #[OA\Response(response: 201, description: "Mensaje creado y enviado (Broadcast)")]
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

    #[OA\Patch(
        path: "/api/messages/{message}",
        summary: "Editar mensaje",
        description: "Edita el contenido de un mensaje existente enviado por el usuario.",
        tags: ["Messages"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "message", in: "path", required: true, description: "ID del mensaje", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "content", type: "string")
        ])
    )]
    #[OA\Response(response: 200, description: "Mensaje modificado")]
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

    #[OA\Delete(
        path: "/api/messages/{message}",
        summary: "Eliminar mensaje",
        description: "Elimina un mensaje enviado por el usuario.",
        tags: ["Messages"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "message", in: "path", required: true, description: "ID del mensaje", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 204, description: "Mensaje eliminado")]
    public function destroy(Message $message): \Illuminate\Http\Response
    {
        $this->authorize('delete', $message);

        $message->delete();

        return response()->noContent();
    }
}
