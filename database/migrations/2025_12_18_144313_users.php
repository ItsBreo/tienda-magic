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
        Schema::create('users', function (Blueprint $table) { // PLURAL 'users'
            $table->id(); // Ya es único y primary key por defecto
            $table->string('username')->unique(); // Recomendado unique
            $table->string('email')->unique();
            $table->string('password');
            $table->decimal('wallet_balance', 10, 2)->default(0.00);
            $table->boolean('is_active')->default(true); // Mejor true por defecto si no requiere aprobación manual
            $table->rememberToken(); // Necesario para Auth de Laravel
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
