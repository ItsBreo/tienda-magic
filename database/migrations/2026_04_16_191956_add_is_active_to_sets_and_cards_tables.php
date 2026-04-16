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
        Schema::table('card_sets', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('icon_svg_uri');
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->boolean('is_active')->default(true)->after('image_uri');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('card_sets', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });

        Schema::table('cards', function (Blueprint $table) {
            $table->dropColumn('is_active');
        });
    }
};
