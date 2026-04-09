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
        Schema::table('order_items', function (Blueprint $table) {

            // Agregar campos polimórficos
            $table->string('purchasable_type')->nullable()->after('order_id');
            $table->unsignedBigInteger('purchasable_id')->nullable()->after('purchasable_type');

            // Migrar datos existentes
            $table->string('temp_booster_pack_id')->nullable()->after('purchasable_id');
        });

        // Migrar datos existentes a estructura polimórfica
        \Illuminate\Support\Facades\DB::statement('UPDATE order_items SET purchasable_type = ?, purchasable_id = booster_pack_id', ['App\Models\BoosterPack']);

        Schema::table('order_items', function (Blueprint $table) {
            // Eliminar columna antigua después de migrar datos
            $table->dropForeign(['booster_pack_id']);
            $table->dropColumn('booster_pack_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('order_items', function (Blueprint $table) {
            // Restaurar columna original
            $table->foreignId('booster_pack_id')->constrained('booster_pack')->after('order_id');
        });

        // Migrar datos de vuelta (solo los que son booster packs)
        \Illuminate\Support\Facades\DB::statement('UPDATE order_items SET booster_pack_id = purchasable_id WHERE purchasable_type = ?', ['App\Models\BoosterPack']);

        Schema::table('order_items', function (Blueprint $table) {
            // Eliminar campos polimórficos
            $table->dropColumn(['purchasable_type', 'purchasable_id']);
        });
    }
};
