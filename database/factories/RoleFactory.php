<?php

namespace Database\Factories;

use App\Models\Role;
use Illuminate\Database\Eloquent\Factories\Factory;

class RoleFactory extends Factory
{
    protected $model = Role::class;

    public function definition(): array
    {
        return [
            // Genera una palabra aleatoria única para el rol si usas la factory
            'name' => fake()->unique()->word(),
        ];
    }
}

