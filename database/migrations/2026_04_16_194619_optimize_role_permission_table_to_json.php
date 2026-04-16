<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Añadir columna JSON a roles
        Schema::table('roles', function (Blueprint $table) {
            $table->json('permission_ids')->nullable()->after('description');
        });

        // 2. Migrar datos existentes de role_permission a la columna JSON
        $roles = DB::table('roles')->get();
        foreach ($roles as $role) {
            $permissionIds = DB::table('role_permission')
                ->where('role_id', $role->id)
                ->pluck('permission_id')
                ->toArray();
            
            if (!empty($permissionIds)) {
                DB::table('roles')
                    ->where('id', $role->id)
                    ->update(['permission_ids' => json_encode($permissionIds)]);
            } else {
                DB::table('roles')
                    ->where('id', $role->id)
                    ->update(['permission_ids' => json_encode([])]);
            }
        }

        // 3. Eliminar tabla pivot
        Schema::dropIfExists('role_permission');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('role_permission', function (Blueprint $table) {
            $table->id();
            $table->foreignId('role_id')->constrained('roles')->onDelete('cascade');
            $table->foreignId('permission_id')->constrained('permissions')->onDelete('cascade');
            $table->timestamps();
        });

        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('permission_ids');
        });
    }
};
