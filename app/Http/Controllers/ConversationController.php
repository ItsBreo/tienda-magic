<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreConversationRequest;
use App\Http\Resources\ConversationResource;
use App\Models\Conversation;
use App\Models\Trade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use OpenApi\Attributes as OA;

class ConversationController extends Controller
{
    use AuthorizesRequests;

    #[OA\Get(
        path: "/api/conversations",
        summary: "Mis conversaciones",
        description: "Lista las conversaciones donde participa el usuario autenticado.",
        tags: ["Conversations"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista de conversaciones paginada")]
    public function index(Request $request): AnonymousResourceCollection
    {
        $conversations = Conversation::whereHas('participants', function ($query) {
            $query->where('user_id', Auth::id());
        })
            ->with([
                'participants.user',
                'messages' => function ($query) {
                    $query->latest()->first();
                }
            ])
            ->orderBy('last_message_at', 'desc')
            ->paginate(20);

        return ConversationResource::collection($conversations);
    }

    #[OA\Post(
        path: "/api/conversations",
        summary: "Crear conversación",
        description: "Crea una nueva conversación.",
        tags: ["Conversations"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "title", type: "string", nullable: true),
            new OA\Property(property: "type", type: "string", default: "direct"),
            new OA\Property(property: "context_type", type: "string", nullable: true),
            new OA\Property(property: "participant_ids", type: "array", items: new OA\Items(type: "integer"))
        ])
    )]
    #[OA\Response(response: 201, description: "Conversación creada exitosamente")]
    public function store(StoreConversationRequest $request): ConversationResource
    {
        $validated = $request->validated();

        $conversation = Conversation::create([
            'title' => $validated['title'] ?? null,
            'type' => $validated['type'] ?? 'direct',
            'context_type' => $validated['context_type'] ?? null,
            'context_id' => $validated['context_id'] ?? null,
            'metadata' => $validated['metadata'] ?? null,
        ]);

        $role = $this->determineUserRole($validated);

        $conversation->participants()->create([
            'user_id' => Auth::id(),
            'role' => $role,
        ]);

        if (isset($validated['participant_ids']) && is_array($validated['participant_ids'])) {
            foreach ($validated['participant_ids'] as $participantId) {
                $conversation->participants()->create([
                    'user_id' => $participantId,
                    'role' => 'participant',
                ]);
            }
        }

        $conversation->load(['participants.user']);

        return new ConversationResource($conversation);
    }

    #[OA\Get(
        path: "/api/conversations/{conversation}",
        summary: "Ver conversación",
        description: "Obtiene una conversación por ID junto con los últimos mensajes.",
        tags: ["Conversations"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "conversation", in: "path", required: true, description: "UUID de la conversación", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Datos de la conversación")]
    public function show(Conversation $conversation): ConversationResource
    {
        $this->authorize('view', $conversation);

        $conversation->load([
            'participants.user',
            'messages' => function ($query) {
                $query->latest()->limit(50);
            }
        ]);

        return new ConversationResource($conversation);
    }

    #[OA\Post(
        path: "/api/trades/{tradeId}/chat",
        summary: "Chat del Trade Base",
        description: "Obtiene o crea un chat para un trade base específico.",
        tags: ["Conversations"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "tradeId", in: "path", required: true, description: "ID del Trade", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Datos del chat")]
    public function getOrCreateForTrade(int $tradeId): \Illuminate\Http\JsonResponse
    {
        // Buscar si ya existe una conversación para este trade
        $conversation = Conversation::where('trade_id', $tradeId)->first();

        if (!$conversation) {
            // Crear nueva conversación asociada al trade
            $conversation = Conversation::create([
                'id' => Str::uuid(),
                'title' => "Trade #{$tradeId}",
                'type' => 'trade',
                'trade_id' => $tradeId,
                'metadata' => [
                    'trade_id' => $tradeId,
                    'created_for_trade' => true
                ]
            ]);
        }

        // Asegurar que el usuario actual está adjunto a la conversación (lista VIP)
        $conversation->users()->syncWithoutDetaching([auth()->id()]);

        return response()->json([
            'id' => $conversation->id,
            'title' => $conversation->title,
            'type' => $conversation->type,
            'trade_id' => $conversation->trade_id
        ]);
    }

    private function determineUserRole(array $validated): string
    {
        if (isset($validated['context_type'])) {
            return match ($validated['context_type']) {
                'trade' => 'buyer',
                'market' => 'buyer',
                'support' => 'member',
                default => 'creator'
            };
        }

        return 'creator';
    }
}
