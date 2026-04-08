<?php

namespace Database\Factories;

use App\Models\Comment;
use App\Models\Thread;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Comment>
 */
class CommentFactory extends Factory
{
    protected $model = Comment::class;

    public function definition(): array
    {
        return [
            'thread_id' => Thread::factory(),
            'user_id'   => User::factory(),
            'parent_id' => null, // Por defecto son comentarios principales
            'body'      => fake()->paragraphs(rand(1, 2), true),
            'score'     => fake()->numberBetween(0, 30),
            'is_hidden' => fake()->boolean(2), // 2% de probabilidad de que el comentario esté oculto por moderación
        ];
    }
}
