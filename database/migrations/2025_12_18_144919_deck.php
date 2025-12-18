<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('deck', function (Blueprint $table) {
            $table->id("deck_id")->unique();

            $table->primary("deck_id");
            $table->foreignId("user_id")->constrained("user");
            $table->string("name");
            $table->boolean("is_public")->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('decks');
    }
};
