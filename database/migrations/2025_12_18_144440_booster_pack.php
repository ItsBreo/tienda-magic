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
        Schema::create("booster_pack", function (Blueprint $table) {
            $table->id();
            $table->string("name")->constrained("card_sets");
            $table->float("price");
            $table->foreignId("card_set_id")->constrained("card_sets");
            $table->string("type");
            $table->json("config");
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists("booster_pack");
    }
};
