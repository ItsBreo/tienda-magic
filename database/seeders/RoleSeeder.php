<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Crea los roles estándar del sistema si no existen.
 *
 * Jerarquía:
 *   super_admin  (nivel 4) → control total de tienda
 *   admin        (nivel 3) → CRUD foros, borra cualquier contenido, asigna mods
 *   mod_news     (nivel 2) → modera la sección Noticias
 *   mod_tournaments (2)   → modera la sección Torneos
 *   mod_general  (nivel 2) → modera la sección General
 *   user         (nivel 1) → usuario registrado
 */
class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'super_admin', 'description' => 'Control total de la tienda y el foro'],
            ['name' => 'admin',       'description' => 'Administrador del foro: añade categorías, borra contenido, asigna moderadores'],
            ['name' => 'mod_news',       'description' => 'Moderador sectorial — sección Noticias'],
            ['name' => 'mod_tournaments','description' => 'Moderador sectorial — sección Torneos'],
            ['name' => 'mod_general',    'description' => 'Moderador sectorial — sección General'],
            ['name' => 'user',        'description' => 'Usuario registrado'],
        ];

        foreach ($roles as $role) {
            DB::table('roles')->updateOrInsert(
                ['name' => $role['name']],
                array_merge($role, [
                    'created_at' => now(),
                    'updated_at' => now(),
                ])
            );
        }

        $this->command->info('✅ Roles del sistema creados/actualizados.');
    }
}
