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
        // Tabla polimórfica para manejar votos tanto de Hilos (Threads) como de Comentarios (Comments)
        Schema::create('votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->morphs('votable'); // Crea votable_id y votable_type
            $table->tinyInteger('value'); // 1 para upvote, -1 para downvote
            $table->timestamps();

            // Evitar que un mismo usuario vote varias veces el mismo registro
            $table->unique(['user_id', 'votable_id', 'votable_type'], 'user_vote_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('votes');
    }
};
