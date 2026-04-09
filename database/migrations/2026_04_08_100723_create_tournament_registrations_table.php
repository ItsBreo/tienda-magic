<?php
// database/migrations/2024_01_01_000002_create_tournament_registrations_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournament_registrations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('tournament_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();

            $table->enum('status', ['pending', 'confirmed', 'cancelled'])
                  ->default('pending');

            $table->timestamp('registered_at')->useCurrent();
            $table->timestamp('confirmed_at')->nullable();

            $table->timestamps();

            // Un usuario solo puede inscribirse una vez por torneo
            $table->unique(['tournament_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournament_registrations');
    }
};
