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
        Schema::create('inventory_pack', function (Blueprint $table) {
            $table->id();

            // CONEXIÓN DIRECTA AL USUARIO (PROTEGIDO)
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('restrict');

            // Referencia al SET al que pertenece el sobre (según tu esquema original)
            $table->foreignId('booster_pack_id')
                  ->constrained('booster_pack')
                  ->onDelete('cascade');

            $table->integer('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_pack');
    }
};
