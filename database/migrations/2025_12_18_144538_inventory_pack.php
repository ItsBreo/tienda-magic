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
        Schema::create('inventory_pack', function (Blueprint $table) {
            $table->id()->unique();
            foreignId('inventory_id')->nullable()->constrained('inventory');
            foreignId('card_sets_id')->nullable()->constrained('cart_sets');
            $table->integer('quantity');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('inventory_pack');
    }
};
