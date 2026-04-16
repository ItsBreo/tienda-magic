<?php

namespace App\Http\Controllers\Forum;

use App\Models\Thread;
use Illuminate\Support\Facades\Auth;
use App\Http\Resources\ThreadResource;
use App\Http\Controllers\Controller;
use OpenApi\Attributes as OA;

class SavedThreadController extends Controller
{
    #[OA\Get(
        path: "/api/saved",
        summary: "Lista de hilos guardados",
        description: "Devuelve los hilos que el usuario ha guardado.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Response(response: 200, description: "Lista paginada de hilos guardados")]
    public function index(\Illuminate\Http\Request $request)
    {
        $saved = Auth::user()
            ->savedThreads()
            ->with(['user', 'forum'])
            ->latest('saved_threads.created_at')
            ->paginate($request->get('per_page', 20));

        return ThreadResource::collection($saved);
    }

    #[OA\Post(
        path: "/api/saved/{thread}",
        summary: "Guardar hilo",
        description: "Añade un hilo a la lista de guardados del usuario.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Hilo guardado exitosamente")]
    public function store(Thread $thread)
    {
        Auth::user()->savedThreads()->syncWithoutDetaching([$thread->id]);

        return response()->json(['message' => 'Thread guardado.']);
    }

    #[OA\Delete(
        path: "/api/saved/{thread}",
        summary: "Eliminar hilo guardado",
        description: "Saca un hilo de la lista de guardados del usuario.",
        tags: ["Forums"],
        security: [["bearerAuth" => []]]
    )]
    #[OA\Parameter(name: "thread", in: "path", required: true, description: "ID del hilo", schema: new OA\Schema(type: "integer"))]
    #[OA\Response(response: 200, description: "Hilo eliminado exitosamente de guardados")]
    public function destroy(Thread $thread)
    {
        Auth::user()->savedThreads()->detach($thread->id);

        return response()->json(['message' => 'Thread eliminado de guardados.']);
    }
}
