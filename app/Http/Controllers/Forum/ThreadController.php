<?php

namespace App\Http\Controllers\Forum;

use App\Http\Controllers\Controller;
use App\Http\Resources\ThreadResource;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use OpenApi\Attributes as OA;

class ThreadController extends Controller
{
    #[OA\Get(
        path: "/api/threads",
        summary: "Lista global de threads",
        description: "Obtiene los últimos hilos del foro ordenados por popularidad, fecha, etc.",
        tags: ["Forums"]
    )]
    #[OA\Parameter(name: "sort", in: "query", required: false, description: "Orden (hot, top, new, commented)", schema: new OA\Schema(type: "string", default: "hot"))]
    #[OA\Response(response: 200, description: "Lista de hilos")]
    public function index(Request $request)
    {
        $sort = $request->get('sort', 'hot');

        $perPage = $request->get('per_page', 20);
        
        $threads = Thread::with(['user', 'forum', 'votes'])
            ->withCount('comments')
            ->when(in_array($sort, ['new', 'nuevo']), fn($q) => $q->latest())
            ->when($sort === 'top', fn($q) => $q->orderByDesc('score'))
            ->when(in_array($sort, ['commented', 'comentado']), fn($q) => $q->has('comments')->orderByDesc('comments_count'))
            ->when($sort === 'hot', fn($q) => $q->orderByDesc('score')->latest())
            ->paginate($perPage);

        return ThreadResource::collection($threads);
    }

    #[OA\Get(
        path: "/api/forum/search",
        summary: "Buscar en foros",
        description: "Busca dentro de los hilos de los foros por título o contenido.",
        tags: ["Forums"]
    )]
    #[OA\Parameter(name: "q", in: "query", required: true, description: "Término de búsqueda (min 3 caracteres)", schema: new OA\Schema(type: "string"))]
    #[OA\Response(response: 200, description: "Resultados de búsqueda")]
    public function search(Request $request)
    {
        $query = $request->get('q', '');

        if (strlen($query) < 3) {
            return ThreadResource::collection([]);
        }

        $perPage = $request->get('per_page', 20);

        $threads = Thread::with(['user', 'forum', 'votes'])
            ->withCount('comments')
            ->where('title', 'like', "%{$query}%")
            ->orWhere('body', 'like', "%{$query}%")
            ->latest()
            ->paginate($perPage);

        return ThreadResource::collection($threads);
    }

    #[OA\Get(
        path: "/api/threads/{thread}",
        summary: "Ver hilo del foro",
        description: "Obtiene los detalles del hilo y carga sus comentarios raíz.",
        tags: ["Forums"]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Thread cargado (incrementa views)")]
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

    #[OA\Post(
        path: "/api/threads",
        summary: "Crear hilo de foro",
        description: "Crea un nuevo hilo (thread) vinculado al usuario activo.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "forum_id", type: "integer"),
            new OA\Property(property: "title", type: "string"),
            new OA\Property(property: "body", type: "string"),
            new OA\Property(property: "tags", type: "array", items: new OA\Items(type: "string"))
        ])
    )]
    #[OA\Response(response: 201, description: "Hilo creado exitosamente")]
    public function store(Request $request)
    {
        $validated = $request->validate([
            'forum_id' => 'required|exists:forums,id',
            'title'    => 'required|string|max:255',
            'body'     => 'required|string',
            'tags'     => 'nullable|array',
            'tags.*'   => 'string|max:50',
            'image'    => 'nullable|image|max:5120', // Máximo 5MB
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('forum_images', 'public');
            $validated['image'] = $path;
        }

        $thread = $request->user()->threads()->create($validated);
        $thread->load(['user', 'forum']);

        return new ThreadResource($thread);
    }

    #[OA\Put(
        path: "/api/threads/{thread}",
        summary: "Editar hilo",
        description: "Edita el cuerpo o el título de un hilo (solo para el autor).",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\RequestBody(
        required: true,
        content: new OA\JsonContent(properties: [
            new OA\Property(property: "title", type: "string"),
            new OA\Property(property: "body", type: "string"),
            new OA\Property(property: "tags", type: "array", items: new OA\Items(type: "string"))
        ])
    )]
    #[OA\Response(response: 200, description: "Hilo editado exitosamente")]
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

    #[OA\Delete(
        path: "/api/threads/{thread}",
        summary: "Eliminar hilo",
        description: "Borra el hilo (soft-delete) si eres el autor.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Mensaje correcto")]
    public function destroy(Thread $thread)
    {
        $this->authorize('delete', $thread);

        $thread->delete();

        return response()->json(['message' => 'Thread eliminado correctamente.']);
    }
}
