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
        Schema::create('user_preference', function (Blueprint $table) {
            $table->id()->unique();
            $table->string('theme');
            $table->string('language');
            $table->foreignId('user_id')->nullable()->constrained('users_shop');
            $table->boolean('is_inventory_public')->default(false);
            $table->boolean('allow_trade_requests')->default(false);
            $table->timestamps();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preference');
    }
};
