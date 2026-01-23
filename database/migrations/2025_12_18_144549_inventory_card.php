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
        Schema::create('inventory_card', function (Blueprint $table) {
            $table->id(); // id() ya implica unique() y primary key

            // CONEXIÓN DIRECTA AL USUARIO
            $table->foreignId('user_id')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->foreignId('card_id')
                  ->constrained('cards')
                  ->onDelete('cascade');

            $table->integer('quantity')->default(1);
            $table->integer('quantity_locked')->default(0); // Para intercambios activos
            $table->boolean('is_foil')->default(false);
            $table->string('condition')->default('NM'); // NM, LP, MP, HP...
            $table->string('language')->default('en');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_card');
    }
};
