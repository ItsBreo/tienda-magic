<?php

namespace App\Http\Controllers\Forum;

use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

class VoteController extends Controller
{
    #[OA\Post(
        path: "/api/votes",
        summary: "Votar hilo o comentario",
        description: "Emite un voto (upvote o downvote) para un comentario o hilo.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "votable_id", type: "integer"),
            new OA\Property(property: "votable_type", type: "string", enum: ["thread", "comment"]),
            new OA\Property(property: "value", type: "integer", enum: [1, -1])
        ])
    )]
    #[OA\Response(response: 201, description: "Voto registrado")]
    public function store(Request $request)
    {
        // Convertimos a minúsculas por si React envía "Thread" o "Comment" en lugar de "thread" o "comment"
        if ($request->has('votable_type')) {
            $request->merge(['votable_type' => strtolower($request->votable_type)]);
        }

        $validated = $request->validate([
            'votable_id'   => 'required|integer',
            'votable_type' => 'required|in:thread,comment',
            'value'        => 'required|in:-1,1',
        ]);

        // Convertimos el tipo al nombre completo del modelo
        $modelMap = [
            'thread'  => \App\Models\Thread::class,
            'comment' => \App\Models\Comment::class,
        ];

        $votableType = $modelMap[$validated['votable_type']];
        $votableId   = $validated['votable_id'];
        $value       = $validated['value'];
        $userId      = Auth::id();

        // Buscamos si ya existe un voto de este usuario para este registro
        $existingVote = Vote::where('user_id', $userId)
            ->where('votable_type', $votableType)
            ->where('votable_id', $votableId)
            ->first();

        if ($existingVote) {
            if ($existingVote->value === $value) {
                // Si vota igual que antes → cancela el voto (toggle)
                $existingVote->delete();
                $newScore = $this->updateScore($votableType, $votableId, -$value);

                return response()->json([
                    'message'   => 'Voto cancelado.',
                    'score'     => $newScore,
                    'user_vote' => null
                ]);
            } else {
                // Si cambia de upvote a downvote o viceversa → actualiza
                $diff = $value - $existingVote->value; // Ej: 1 - (-1) = 2
                $existingVote->update(['value' => $value]);
                $newScore = $this->updateScore($votableType, $votableId, $diff);

                return response()->json([
                    'message'   => 'Voto actualizado.',
                    'score'     => $newScore,
                    'user_vote' => $value
                ]);
            }
        }

        // Voto nuevo
        Vote::create([
            'user_id'      => $userId,
            'votable_type' => $votableType,
            'votable_id'   => $votableId,
            'value'        => $value,
        ]);

        $newScore = $this->updateScore($votableType, $votableId, $value);

        return response()->json([
            'message'   => 'Voto registrado.',
            'score'     => $newScore,
            'user_vote' => $value
        ], 201);
    }

    // Actualiza el score cacheado en el thread o comment correspondiente
    private function updateScore(string $votableType, int $votableId, int $diff): int
    {
        $votableType::where('id', $votableId)->increment('score', $diff);

        return $votableType::where('id', $votableId)->value('score');
    }
}
