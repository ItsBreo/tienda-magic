<?php

namespace App\Http\Controllers\Forum;

use App\Models\Thread;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\ThreadResource;
use App\Http\Controllers\Controller;

class SavedThreadController extends Controller
{
    // Lista los threads guardados del usuario autenticado
    public function index()
    {
        $saved = Auth::user()
            ->savedThreads()
            ->with(['user', 'forum'])
            ->latest('saved_threads.created_at')
            ->paginate(20);

        return ThreadResource::collection($saved);
    }

    // Guarda un thread
    public function store(Thread $thread)
    {
        Auth::user()->savedThreads()->syncWithoutDetaching([$thread->id]);

        return response()->json(['message' => 'Thread guardado.']);
    }

    // Quita un thread de guardados
    public function destroy(Thread $thread)
    {
        Auth::user()->savedThreads()->detach($thread->id);

        return response()->json(['message' => 'Thread eliminado de guardados.']);
    }
}
