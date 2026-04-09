<?php
// database/migrations/2024_01_01_000001_create_tournaments_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tournaments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->cascadeOnDelete();

            $table->string('name');
            $table->text('description')->nullable();
            $table->dateTime('starts_at');
            $table->string('location');

            $table->enum('format', [
                'standard', 'modern', 'pioneer',
                'legacy', 'draft', 'sealed', 'commander'
            ]);

            $table->unsignedSmallInteger('max_players')->default(32);
            $table->decimal('entry_fee', 8, 2)->default(0.00);
            $table->string('prize')->nullable();

            $table->enum('status', ['upcoming', 'ongoing', 'finished', 'cancelled'])
                  ->default('upcoming');

            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tournaments');
    }
};
