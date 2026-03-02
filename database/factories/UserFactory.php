<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected $model = User::class;
    protected static ?string $password;

    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            'username' => fake()->unique()->userName(), // Deducido de UserController
            'email' => fake()->unique()->safeEmail(),   // Deducido de UserController
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'wallet_balance' => fake()->randomFloat(2, 0, 5000), // Deducido de UserController
            'remember_token' => Str::random(10),
        ];
    }
}
