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
        Schema::table('cart_item', function (Blueprint $table) {
            if (!Schema::hasColumn('cart_item', 'card_id')) {
                $table->foreignId('card_id')
                    ->nullable()
                    ->after('booster_pack_id')
                    ->constrained('cards')
                    ->onDelete('set null');
            }
            
            // Asegurar que booster_pack_id sea nullable por si no lo es
            $table->foreignId('booster_pack_id')->nullable()->change();
        });

        Schema::table('order_items', function (Blueprint $table) {
            if (!Schema::hasColumn('order_items', 'card_id')) {
                $table->foreignId('card_id')
                    ->nullable()
                    ->after('booster_pack_id')
                    ->constrained('cards')
                    ->onDelete('set null');
            }

            // Asegurar que booster_pack_id sea nullable
            $table->foreignId('booster_pack_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_item', function (Blueprint $table) {
            $table->dropForeign(['card_id']);
            $table->dropColumn('card_id');
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropForeign(['card_id']);
            $table->dropColumn('card_id');
        });
    }
};
