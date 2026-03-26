<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trade_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('proposer_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->foreignId('receiver_id')
                  ->constrained('users')
                  ->cascadeOnDelete();
            $table->enum('status', [
                'pending',
                'active',
                'completed',
                'cancelled',
                'expired'
            ])->default('pending');
            $table->decimal('proposer_balance', 10, 2)->default(0);
            $table->decimal('receiver_balance', 10, 2)->default(0);
            $table->boolean('proposer_confirmed')->default(false);
            $table->boolean('receiver_confirmed')->default(false);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_sessions');
    }
};
