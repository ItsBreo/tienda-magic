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
            $table->foreignId('seller_id')->constrained('users');
            $table->foreignId('buyer_id')->nullable()->constrained('users');
            
            // Relación polimórfica (Card o BoosterPack)
            $table->unsignedBigInteger('listable_id');
            $table->string('listable_type');
            
            // Referencia al item específico del inventario
            $table->unsignedBigInteger('inventory_item_id'); // ID de inventory_card o inventory_pack
            
            $table->decimal('price_total', 10, 2);      // Lo que paga el comprador (incluye comisión)
            $table->decimal('fee_platform', 10, 2);     // Lo que gana la plataforma
            $table->decimal('amount_to_seller', 10, 2); // Lo que recibe el vendedor
            
            $table->enum('status', ['active', 'sold', 'cancelled'])->default('active');
            $table->timestamps();
            
            $table->index(['listable_id', 'listable_type']);
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
