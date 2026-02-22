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
        // Primero eliminar la foreign key constraint
        Schema::table('cards', function (Blueprint $table) {
            $table->dropForeign(['card_set_id']);
        });

        // Luego cambiar el tipo de columna
        Schema::table('cards', function (Blueprint $table) {
            $table->string('card_set_id', 255)->nullable()->change();
        });

        // Finalmente, restaurar la foreign key (si es necesario)
        // Nota: Como ahora card_set_id es string, no podemos referenciar a card_set.id (entero)
        // Por ahora dejamos sin foreign key hasta que definamos la relación correcta
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Eliminar cualquier foreign key existente
        Schema::table('cards', function (Blueprint $table) {
            $table->dropForeign(['card_set_id']);
        });

        // Cambiar de vuelta a bigint
        Schema::table('cards', function (Blueprint $table) {
            $table->bigInteger('card_set_id')->unsigned()->nullable()->change();
        });
    }
};
