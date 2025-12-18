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
            $table->id()->unique();
            $table->foreignId('inventory_id')->nullable()->constrained('inventory');
            $table->foreignId('card_id')->nullable()->constrained('cards');
            $table->integer('quantity');
            $table->integer('quantity_locked');
            $table->boolean('is_foil');
            $table->string('condition');
            $table->string('language');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_card');
    }
};
