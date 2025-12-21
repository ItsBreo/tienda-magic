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
        Schema::create('thread', function (Blueprint $table) {
            $table->id();
            $table->foreignId('forum_category_id');
            $table->foreignId('user_id');
            $table->string('title');
            $table->text('content');
            $table->boolean('is_pinned')->default(false);
            $table->boolean('is_locked')->default(false);
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
