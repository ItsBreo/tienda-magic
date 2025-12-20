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
        Schema::create('cart_item', function (Blueprint $table) {

            $table->float('quantity');

            $table->timestamps();

            $table->foreignId('cart_id')
                ->nullable()
                ->constrained('cart');

            $table->foreignId('booster_pack_id')
                ->nullable()
                ->constrained('booster_pack');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
