<?php

namespace App\Http\Controllers\Forum;

use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\Controller;

class VoteController extends Controller
{
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

    // Actualiza el score cacheado en el thread o comment correspondiente,
    // y actualiza el reputation_score del perfil del autor en un proceso unificado.
    private function updateScore(string $votableType, int $votableId, int $diff): int
    {
        $votable = $votableType::where('id', $votableId)->first();
        if ($votable) {
            $votable->increment('score', $diff);

            // Inyectar el impacto del voto en el perfil del autor
            $author = $votable->user;
            if ($author && $author->profile) {
                // Según la fórmula: Threads dan 2 puntos por positivo, Comments 1 punto.
                $repDiff = ($votableType === \App\Models\Thread::class) ? ($diff * 2) : $diff;
                $author->profile->increment('reputation_score', $repDiff);
            }
            return $votable->score;
        }

        return 0;
    }
}
