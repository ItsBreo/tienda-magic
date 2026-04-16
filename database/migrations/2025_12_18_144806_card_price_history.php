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
        Schema::create("card_price_history", function (Blueprint $table) {
            $table->id();
            // Soporte para precios de cartas y de sobres
            $table->unsignedBigInteger('priceable_id');
            $table->string('priceable_type');
            
            $table->float("price");
            $table->timestamp("recorded_at")->useCurrent();
            
            $table->index(['priceable_id', 'priceable_type', 'recorded_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("card_price_history");
    }
};
