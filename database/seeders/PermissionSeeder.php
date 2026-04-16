<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // Gestión de Usuarios y Roles
            ['name' => 'manage-users', 'display_name' => 'Gestionar Usuarios', 'description' => 'Permite ver, crear, editar y borrar usuarios.'],
            ['name' => 'assign-roles', 'display_name' => 'Asignar Roles', 'description' => 'Permite cambiar los roles de los usuarios.'],
            ['name' => 'manage-roles', 'display_name' => 'Gestionar Roles', 'description' => 'Permite crear, editar y borrar roles y sus permisos.'],

            // Gestión de la Tienda
            ['name' => 'manage-sets', 'display_name' => 'Gestionar Sets', 'description' => 'Permite gestionar expansiones de cartas.'],
            ['name' => 'manage-cards', 'display_name' => 'Gestionar Cartas', 'description' => 'Permite gestionar el catálogo de cartas individualmente.'],
            ['name' => 'manage-booster-packs', 'display_name' => 'Gestionar Sobres', 'description' => 'Permite crear y editar tipos de sobres.'],
            ['name' => 'manage-orders', 'display_name' => 'Gestionar Pedidos', 'description' => 'Permite ver y gestionar pedidos de la tienda.'],

            // Moderación y Comunidad
            ['name' => 'moderate-forum', 'display_name' => 'Moderar Foro', 'description' => 'Permite borrar hilos y comentarios en los foros asignados.'],
            ['name' => 'restore-content', 'display_name' => 'Restaurar Contenido', 'description' => 'Permite restaurar contenido borrado (Soft Deleted).'],
            
            // Torneos
            ['name' => 'manage-tournaments', 'display_name' => 'Gestionar Torneos', 'description' => 'Permite crear, editar y gestionar inscripciones a torneos.'],

            // Administración General
            ['name' => 'view-admin-dashboard', 'display_name' => 'Ver Dashboard Admin', 'description' => 'Permite el acceso al panel administrativo.'],
        ];

        foreach ($permissions as $permission) {
            \App\Models\Permission::updateOrCreate(['name' => $permission['name']], $permission);
        }

        // Asignar todos los permisos a los roles administrativos automáticamente
        $allPermissionIds = \App\Models\Permission::pluck('id')->toArray();
        
        \App\Models\Role::whereIn('name', ['admin', 'super_admin'])
            ->get()
            ->each(function ($role) use ($allPermissionIds) {
                $role->update(['permission_ids' => $allPermissionIds]);
            });
    }
}
