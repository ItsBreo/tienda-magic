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
            $table->string('collector_number');
            $table->string('rarity');
            $table->string('image_uri')->nullable();
            $table->decimal('price_eur', 8, 2)->nullable();
            $table->decimal('price_usd', 8, 2)->nullable();

            $table->boolean("is_in_sale")->default(false);
            $table->decimal('market_avg_price', 10, 2)->default(0);

            $table->foreignId('card_set_id')
            ->nullable()
            ->constrained('card_sets');

            $table->timestamps();
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
