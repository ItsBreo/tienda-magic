<?php

namespace Database\Seeders;

use App\Models\Comment;
use App\Models\Forum;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ForumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Crear algunos usuarios para que sean los autores
        $users = User::factory(15)->create();

        // 2. Crear los foros principales de la aplicación
        // Basado en los atributos de foro: id, name, icon, slug
        $forums = Forum::factory()->createMany([
            ['name' => 'General', 'slug' => 'general', 'icon' => 'heroicon-o-chat-bubble-left'],
            ['name' => 'Noticias', 'slug' => 'noticias', 'icon' => 'heroicon-o-newspaper'],
            ['name' => 'Dudas y Reglas', 'slug' => 'dudas-y-reglas', 'icon' => 'heroicon-o-question-mark-circle'],
            ['name' => 'Estrategia y Decks', 'slug' => 'estrategia', 'icon' => 'heroicon-o-light-bulb'],
            ['name' => 'Torneos', 'slug' => 'torneos', 'icon' => 'heroicon-o-trophy'],
            ['name' => 'Mercado', 'slug' => 'mercado', 'icon' => 'heroicon-o-currency-dollar'],
        ]);

        // 3. Crear Hilos (Threads) aleatorios para cada Foro
        foreach ($forums as $forum) {
            // Creamos entre 5 y 10 hilos aleatorios por cada foro
            Thread::factory(rand(5, 10))->create([
                'forum_id' => $forum->id,
                'user_id'  => $users->random()->id,
            ])->each(function ($thread) use ($users) {

                // 4. Crear Comentarios principales para cada hilo recién creado
                $comments = Comment::factory(rand(3, 8))->create([
                    // Suponiendo que tus comentarios se asocian a un thread
                    'thread_id' => $thread->id,
                    'user_id'   => $users->random()->id,
                ]);

                // 5. Crear Respuestas (replies) anidadas aleatoriamente
                foreach ($comments as $comment) {
                    // Probabilidad del 40% de que alguien responda al comentario
                    if (rand(1, 100) <= 40) {
                        Comment::factory(rand(1, 3))->create([
                            'thread_id' => $thread->id,
                            'user_id'   => $users->random()->id,
                            'parent_id' => $comment->id, // Atributo típico para relaciones de respuestas
                        ]);
                    }
                }
            });
        }
    }
}
