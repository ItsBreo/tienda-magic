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
        Schema::create('wallet_transaction', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id');
            $table->string('type');
            $table->decimal('amount', 10, 2);
            $table->decimal('balance_after', 10, 2);
            $table->string('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wallet_transaction');
    }
};
