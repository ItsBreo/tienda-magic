<?php

namespace Database\Factories;

use App\Models\Forum;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Thread>
 */
class ThreadFactory extends Factory
{
    protected $model = Thread::class;

    public function definition(): array
    {
        return [
            'forum_id'       => Forum::factory(),
            'user_id'        => User::factory(),
            'title'          => fake()->sentence(),
            'body'           => fake()->paragraphs(rand(2, 5), true), // Un texto de entre 2 y 5 párrafos
            'score'          => fake()->numberBetween(0, 150),        // Puntuación de votos aleatoria
            'views_count'    => fake()->numberBetween(10, 1000),      // Visitas aleatorias
            'tags'           => fake()->randomElements(['magic', 'reglas', 'torneo', 'dudas', 'deck', 'combo', 'commander'], rand(1, 3)),
            'is_pinned'      => fake()->boolean(5), // 5% de probabilidad de estar fijado
            'is_locked'      => fake()->boolean(2), // 2% de probabilidad de estar bloqueado
            'comments_count' => 0,
        ];
    }
}
