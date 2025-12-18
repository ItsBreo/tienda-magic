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
            $table->foreignId("card_id")->constrained("cards");
            $table->float("price");
            $table->date("recorded_at");
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
