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
        Schema::create('trade_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('exchange_request_id')->constrained('exchange_requests')->cascadeOnDelete();
            $table->enum('status', ['active', 'completed', 'cancelled'])->default('active');
            $table->boolean('user1_confirmed')->default(false);
            $table->boolean('user2_confirmed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('trade_sessions');
    }
};
