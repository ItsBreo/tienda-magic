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
        Schema::create('threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('forum_id')->constrained('forums')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title');
            $table->text('body'); // El contenido completo (en el feed usaremos Str::limit() para la 'preview')
            $table->integer('score')->default(0); // Suma cacheada de upvotes/downvotes
            $table->integer('views_count')->default(0);
            $table->integer('comments_count')->default(0); // Contador físico real
            $table->json('tags')->nullable(); // Array de strings como ["#spoiler", "#bloomburrow"]
            $table->boolean('is_pinned')->default(false); // Para fijar posts importantes
            $table->boolean('is_locked')->default(false); // Para cerrar hilos
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('threads');
    }
};
