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
        Schema::create('market_listings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id');
            $table->foreignId('buyer_id');
            $table->foreignId('inventory_card_id');
            $table->decimal('price_total', 10, 2);
            $table->decimal('fee_platform', 10, 2);
            $table->decimal('amount_to_seller', 10, 2);
            $table->string('status');
            $table->date('listed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_listings');
    }
};
