<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trade_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trade_session_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->morphs('itemable'); // itemable_type + itemable_id
            $table->unsignedInteger('quantity')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_items');
    }
};
