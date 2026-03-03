<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear los roles fijos primero
        $adminRole = Role::create(['name' => 'Admin']);
        $userRole = Role::create(['name' => 'User']);
        $sellerRole = Role::create(['name' => 'Seller']);

        // 2. Crear un usuario Administrador de pruebas específico
        $admin = User::factory()->create([
            'name' => 'Super Admin',
            'username' => 'superadmin',
            'email' => 'admin@ejemplo.com',
            'password' => bcrypt('password'),
        ]);

        // Le asignamos el rol de Admin
        $admin->roles()->attach($adminRole->id);

        // 3. Crear 15 usuarios aleatorios usando la Factory
        $users = User::factory(15)->create();

        // 4. Asignar roles aleatorios a esos 15 usuarios
        foreach ($users as $user) {
            // A la mayoría le damos el rol 'User', pero a algunos les damos 'Seller'
            $roleToAssign = fake()->randomElement([$userRole->id, $userRole->id, $sellerRole->id]);
            $user->roles()->attach($roleToAssign);
        }
    }
}
