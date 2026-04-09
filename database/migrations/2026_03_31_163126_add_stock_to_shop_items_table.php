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
        // Add stock column to cards table
        Schema::table('cards', function (Blueprint $table) {
            $table->integer('stock')->unsigned()->default(100)->after('market_avg_price');
        });

        // Add stock column to booster_packs table
        Schema::table('booster_pack', function (Blueprint $table) {
            $table->integer('stock')->unsigned()->default(100)->after('price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove stock column from cards table
        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn('stock');
        });

        // Remove stock column from booster_packs table
        Schema::table('booster_pack', function (Blueprint $table) {
            $table->dropColumn('stock');
        });
    }
};
