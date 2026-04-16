<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\ForumResource;
use App\Http\Resources\ThreadResource;
use App\Models\Forum;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class ForumController extends Controller
{
    #[OA\Get(
        path: "/api/forums",
        summary: "Lista de Foros",
        description: "Lista todos los foros disponibles para el sidebar.",
        tags: ["Forums"]
    )]
    #[OA\Response(response: 200, description: "Lista de foros")]
    public function index()
    {
        $forums = Forum::withCount('threads')->get();

        return ForumResource::collection($forums);
    }

    #[OA\Get(
        path: "/api/forums/{forum}",
        summary: "Foro y sus threads",
        description: "Muestra los threads de un foro concreto, paginados y ordenados por parámetro (hot, new, top).",
        tags: ["Forums"]
    )]
    #[OA\Parameter(name: "forum", in: "path", required: true, description: "ID del foro", schema: new OA\Schema(type: "integer"))]
    #[OA\Parameter(name: "sort", in: "query", required: false, description: "Tipo de ordenamiento (hot, new, top)", schema: new OA\Schema(type: "string", default: "hot"))]
    #[OA\Response(response: 200, description: "Threads del foro")]
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
