<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Añade el campo 'description' a la tabla roles para describir
     * el propósito de cada rol del sistema.
     */
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->string('description')->nullable()->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('description');
        });
    }
};
