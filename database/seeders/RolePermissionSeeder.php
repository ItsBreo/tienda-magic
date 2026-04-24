<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Asigna permisos específicos a los roles modulares
 */
class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Obtener todos los permisos
        $permissions = \App\Models\Permission::all()->keyBy('name');
        
        // Mapeo de permisos por rol modular
        $rolePermissions = [
            'mod_news' => [
                'moderate-forum',
                'restore-content',
            ],
            'mod_tournaments' => [
                'manage-tournaments',
                'moderate-forum',
                'restore-content',
            ],
            'mod_general' => [
                'moderate-forum',
                'restore-content',
            ],
            'mod_strategy' => [
                'moderate-forum',
                'restore-content',
            ],
        ];

        foreach ($rolePermissions as $roleName => $permissionNames) {
            $role = \App\Models\Role::where('name', $roleName)->first();
            if (!$role) continue;

            $permissionIds = [];
            foreach ($permissionNames as $permissionName) {
                if ($permissions->has($permissionName)) {
                    $permissionIds[] = $permissions->get($permissionName)->id;
                }
            }

            $role->update(['permission_ids' => $permissionIds]);
        }

        $this->command->info('✅ Permisos asignados a roles modulares.');
    }
}
