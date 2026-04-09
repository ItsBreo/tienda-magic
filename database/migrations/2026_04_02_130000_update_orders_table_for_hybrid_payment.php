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
        Schema::table('orders', function (Blueprint $table) {
            // Renombrar total_price a total_amount para consistencia
            $table->renameColumn('total_price', 'total_amount');

            // Agregar campos para pago híbrido
            $table->enum('payment_method', ['wallet', 'stripe'])->default('wallet')->after('total_amount');
            $table->enum('payment_status', ['pending', 'completed', 'failed'])->default('pending')->after('payment_method');
            $table->string('stripe_session_id')->nullable()->after('payment_status');

            // Actualizar status para usar valores consistentes
            $table->string('status')->default('pending')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->renameColumn('total_amount', 'total_price');
            $table->dropColumn(['payment_method', 'payment_status', 'stripe_session_id']);
            $table->string('status')->default('PENDING')->change();
        });
    }
};
