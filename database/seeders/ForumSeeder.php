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
            ['name' => 'Estrategia y Decks', 'slug' => 'estrategia', 'icon' => 'heroicon-o-light-bulb'],
            ['name' => 'Torneos', 'slug' => 'torneos', 'icon' => 'heroicon-o-trophy'],
        ]);

        // 3. Crear Hilos (Threads) aleatorios para cada Foro
        foreach ($forums as $forum) {
            // Creamos entre 5 y 10 hilos por foro
            $threads = Thread::factory(rand(5, 10))->create([
                'forum_id' => $forum->id,
                'user_id'  => $users->random()->id,
            ]);

            // 4. Para cada hilo, creamos comentarios y posibles respuestas
            foreach ($threads as $thread) {
                // Crear comentarios principales
                $mainComments = Comment::factory(rand(3, 8))->create([
                    'thread_id' => $thread->id,
                    'user_id'   => $users->random()->id,
                ]);

                // Crear respuestas anidadas con una probabilidad
                $mainComments->each(function ($comment) use ($thread, $users) {
                    if (rand(1, 10) <= 4) { // 40% de probabilidad
                        Comment::factory(rand(1, 2))->create([
                            'thread_id' => $thread->id,
                            'user_id'   => $users->random()->id,
                            'parent_id' => $comment->id,
                        ]);
                    }
                });
            }
        }
    }
}
