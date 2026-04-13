<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Añade forum_id nullable a user_role para que los moderadores sectoriales
     * estén vinculados a un foro concreto. Los roles admin/super_admin/user
     * dejarán este campo en NULL.
     */
    public function up(): void
    {
        Schema::table('user_role', function (Blueprint $table) {
            $table->unsignedBigInteger('forum_id')
                  ->nullable()
                  ->after('roles_id');

            $table->foreign('forum_id')
                  ->references('id')
                  ->on('forums')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('user_role', function (Blueprint $table) {
            $table->dropForeign(['forum_id']);
            $table->dropColumn('forum_id');
        });
    }
};
