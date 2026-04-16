<?php

namespace App\Http\Controllers\Social;

use App\Http\Controllers\Controller;
use App\Models\Forum;
use App\Models\Thread;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ThreadController extends Controller
{
    /**
     * Muestra una lista paginada de hilos para un foro específico.
     */
    public function index(Forum $forum)
    {
        // Carga anticipada para evitar problemas N+1 en la vista de lista
        $threads = $forum->threads()
            ->with(['user:id,name,username', 'forum:id,name,slug'])
            ->withCount('comments') // Para mostrar el número de comentarios
            ->latest()
            ->paginate(15);

        return response()->json($threads);
    }

    /**
     * Almacena un nuevo hilo en la base de datos.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'    => 'required|string|min:5|max:120',
            'body'     => 'required|string|min:10|max:10000',
            'forum_id' => 'required|exists:forums,id',
        ]);

        // Prevenir que usuarios no autorizados publiquen en foros restringidos (si aplica)
        // Gate::authorize('create-thread-in', Forum::find($validated['forum_id']));

        $thread = Thread::create([
            'user_id'  => auth()->id(),
            'forum_id' => $validated['forum_id'],
            'title'    => $validated['title'],
            // Sanitizar el cuerpo para prevenir ataques XSS
            'body'     => strip_tags($validated['body']),
            'slug'     => \Illuminate\Support\Str::slug($validated['title']) . '-' . uniqid(),
        ]);

        return response()->json($thread->load('user'), 201);
    }

    /**
     * Muestra un hilo específico con sus comentarios y autores.
     * Esta es la corrección principal para el bug de nombres "Desconocido".
     */
    public function show(Thread $thread)
    {
        // Carga anticipada (Eager Loading) de todas las relaciones necesarias.
        // Esto es CRÍTICO para evitar el problema "N+1" y que los nombres de usuario aparezcan.
        $thread->load([
            'user:id,name,username,created_at',
            'forum:id,name,slug',
            // Carga los comentarios principales, y para cada uno, su autor (user) y sus respuestas (replies)
            'comments' => fn ($query) => $query->whereNull('parent_id')->latest(),
            'comments.user:id,name,username', // Carga el autor de los comentarios principales
            'comments.replies' => fn ($query) => $query->latest(), // Carga las respuestas de cada comentario
            'comments.replies.user:id,name,username', // Carga el autor de cada respuesta
        ]);

        // Opcional: Incrementar contador de vistas
        $thread->increment('views');

        return response()->json($thread);
    }

    /**
     * Actualiza un hilo existente.
     */
    public function update(Request $request, Thread $thread)
    {
        // Usar una Policy para asegurar que solo el autor o un moderador puede editar
        Gate::authorize('update', $thread);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|min:5|max:120',
            'body'  => 'sometimes|required|string|min:10|max:10000',
        ]);

        $thread->update($validated);

        return response()->json($thread);
    }

    /**
     * Elimina un hilo.
     */
    public function destroy(Thread $thread)
    {
        Gate::authorize('delete', $thread);

        $thread->delete();

        return response()->json(['message' => 'Hilo eliminado correctamente.'], 200);
    }
}
