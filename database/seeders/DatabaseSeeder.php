<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use App\Models\Forum;
use Illuminate\Database\Seeder;
use Database\Seeders\ForumSeeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear la base oficial de roles mediante su propio Seeder
        $this->call([RoleSeeder::class]);

        // 2. Crear permisos y asignarlos a los roles administrativos
        $this->call([PermissionSeeder::class]);

        // 3. Crear los Foros e hilos (esto internamente crerá usuarios random también)
        $this->call([ForumSeeder::class]);

        // 3. Crear los usuarios estáticos de prueba (Para Frontend Devs)
        $this->seedTestAccounts();
    }

    private function seedTestAccounts(): void
    {
        // Buscar roles generados
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $adminRole = Role::where('name', 'admin')->first();
        $modNewsRole = Role::where('name', 'mod_news')->first();
        $modTournamentsRole = Role::where('name', 'mod_tournaments')->first();
        $modGeneralRole = Role::where('name', 'mod_general')->first();
        $modStrategyRole = Role::where('name', 'mod_strategy')->first();
        $userRole = Role::where('name', 'user')->first();

        // Buscar los foros generados en el ForumSeeder por su slug
        $newsForumId = Forum::where('slug', 'noticias')->value('id') ?? 2;
        $tournamentsForumId = Forum::where('slug', 'torneos')->value('id') ?? 4;
        $generalForumId = Forum::where('slug', 'general')->value('id') ?? 1;
        $strategyForumId = Forum::where('slug', 'estrategia')->value('id') ?? 3;

        // -- Super Admin (Nivel 4) --
        $superAdmin = User::factory()->create([
            'name' => 'Dios (Super Admin)',
            'username' => 'superadmin',
            'email' => 'superadmin@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $superAdmin->roles()->attach($superAdminRole->id);

        // -- Admin (Nivel 3) --
        $admin = User::factory()->create([
            'name' => 'El Escriba (Admin)',
            'username' => 'admin_base',
            'email' => 'admin@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $admin->roles()->attach($adminRole->id);

        // -- Moderador de Noticias (Nivel 2 Sectorial) --
        $modNews = User::factory()->create([
            'name' => 'Reportero (Mod Noticias)',
            'username' => 'mod_noticias',
            'email' => 'modnoticias@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $modNews->roles()->attach($modNewsRole->id, ['forum_id' => $newsForumId]);

        // -- Moderador de Torneos (Nivel 2 Sectorial) --
        $modTournaments = User::factory()->create([
            'name' => 'Juez DCI (Mod Torneos)',
            'username' => 'mod_torneos',
            'email' => 'modtorneos@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $modTournaments->roles()->attach($modTournamentsRole->id, ['forum_id' => $tournamentsForumId]);

        // -- Moderador General (Nivel 2 Sectorial) --
        $modGeneral = User::factory()->create([
            'name' => 'Guardián (Mod General)',
            'username' => 'mod_general',
            'email' => 'modgeneral@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $modGeneral->roles()->attach($modGeneralRole->id, ['forum_id' => $generalForumId]);

        // -- Moderador de Estrategia (Nivel 2 Sectorial) --
        $modStrategy = User::factory()->create([
            'name' => 'Mago Táctico (Mod Estrategia)',
            'username' => 'mod_estrategia',
            'email' => 'modestrategia@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $modStrategy->roles()->attach($modStrategyRole->id, ['forum_id' => $strategyForumId]);

        // -- Usuario Normal (Nivel 1) --
        $normalUser = User::factory()->create([
            'name' => 'Planeswalker Novato',
            'username' => 'usuario1',
            'email' => 'usuario@ejemplo.com',
            'password' => bcrypt('password'),
        ]);
        $normalUser->roles()->attach($userRole->id);

        $this->command->info('✅ Cuentas de prueba generadas exitosamente. (admin@ejemplo.com, modnoticias@ejemplo.com, etc)');
    }
}
