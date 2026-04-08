<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\ThreadResource;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ThreadController extends Controller
{
    // Lista todos los threads (para el feed principal / inicio)
    public function index(Request $request)
    {
        $sort = $request->get('sort', 'hot');

        $threads = Thread::with(['user', 'forum', 'votes'])
            ->withCount('comments')
            ->when(in_array($sort, ['new', 'nuevo']), fn($q) => $q->latest())
            ->when($sort === 'top', fn($q) => $q->orderByDesc('score'))
            ->when(in_array($sort, ['commented', 'comentado']), fn($q) => $q->has('comments')->orderByDesc('comments_count'))
            ->when($sort === 'hot', fn($q) => $q->orderByDesc('score')->latest())
            ->paginate(20);

        return ThreadResource::collection($threads);
    }

    // Muestra un thread concreto con sus comentarios raíz
    public function show(Thread $thread)
    {
        // Incrementamos las vistas cada vez que se abre el thread
        $thread->increment('views_count');

        $thread->load([
            'user',
            'forum',
            'votes',
            'comments' => fn($q) => $q->whereNull('parent_id')->with(['user', 'replies.user']),
        ]);

        return new ThreadResource($thread);
    }

    // Crea un nuevo thread
    public function store(Request $request)
    {
        $validated = $request->validate([
            'forum_id' => 'required|exists:forums,id',
            'title'    => 'required|string|max:255',
            'body'     => 'required|string',
            'tags'     => 'nullable|array',
            'tags.*'   => 'string|max:50',
        ]);

        $thread = $request->user()->threads()->create($validated);
        $thread->load(['user', 'forum']);

        return new ThreadResource($thread);
    }

    // Edita un thread (solo el autor)
    public function update(Request $request, Thread $thread)
    {
        $this->authorize('update', $thread);

        $validated = $request->validate([
            'title'  => 'sometimes|string|max:255',
            'body'   => 'sometimes|string',
            'tags'   => 'nullable|array',
            'tags.*' => 'string|max:50',
        ]);

        $thread->update($validated);
        $thread->load(['user', 'forum']);

        return new ThreadResource($thread);
    }

    // Elimina un thread (soft delete, solo el autor)
    public function destroy(Thread $thread)
    {
        $this->authorize('delete', $thread);

        $thread->delete();

        return response()->json(['message' => 'Thread eliminado correctamente.']);
    }
}
