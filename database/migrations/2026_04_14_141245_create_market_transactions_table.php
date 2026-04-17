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
        Schema::create('market_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('seller_id')->constrained('users');
            $table->foreignId('buyer_id')->constrained('users');
            
            // Datos del item (Polimórfico) para saber qué se vendió exactamente
            $table->unsignedBigInteger('sellable_id');
            $table->string('sellable_type');
            
            $table->decimal('price_total', 10, 2);      // Lo que pagó el comprador
            $table->decimal('fee_platform', 10, 2);     // Lo que se quedó la casa
            $table->decimal('amount_to_seller', 10, 2); // Lo que recibió el vendedor
            
            // Detalles extra (JSON) para guardar estado del item en ese momento (condición, foil, set)
            $table->json('item_details')->nullable();
            
            $table->timestamps();
            
            $table->index(['sellable_id', 'sellable_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('market_transactions');
    }
};
