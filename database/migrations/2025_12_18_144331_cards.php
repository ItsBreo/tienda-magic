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
       Schema::create('cards', function (Blueprint $table) {
            $table->id();

            // ID único de Scryfall (UUID) para evitar duplicados
            $table->string('scryfall_id')->unique();

            // Campos "calientes" (Los sacamos del JSON para buscar rápido con SQL)
            $table->string('name')->index();
            $table->string('set_code')->index();
            $table->string('rarity');
            $table->decimal('market_avg_price', 10, 2)->default(0);
            $table->string('image_url')->nullable();

            $table->jsonb('data');

            $table->timestamps();

            $table->foreignId('card_set_id')
            ->nullable()
            ->constrained('card_sets');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cards');
    }
};
