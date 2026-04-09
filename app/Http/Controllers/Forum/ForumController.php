<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\ForumResource;
use App\Http\Resources\ThreadResource;
use App\Models\Forum;
use Illuminate\Http\Request;

class ForumController extends Controller
{
    // Lista todos los foros (para el sidebar)
    public function index()
    {
        $forums = Forum::withCount('threads')->get();

        return ForumResource::collection($forums);
    }

    // Muestra los threads de un foro concreto
    public function show(Forum $forum, Request $request)
    {
        $sort = $request->get('sort', 'hot');

        $threads = $forum->threads()
            ->with(['user', 'forum', 'votes'])
            ->withCount('comments')
            ->when(in_array($sort, ['new', 'nuevo']), fn($q) => $q->latest())
            ->when($sort === 'top', fn($q) => $q->orderByDesc('score'))
            ->when(in_array($sort, ['commented', 'comentado']), fn($q) => $q->orderByDesc('comments_count'))
            ->when($sort === 'hot', fn($q) => $q->orderByDesc('score')->latest())
            ->paginate(20);

        return ThreadResource::collection($threads);
    }
}
