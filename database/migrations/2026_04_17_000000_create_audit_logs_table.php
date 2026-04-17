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
        Schema::create('audit_logs', function (Blueprint $column) {
            $column->id();
            $column->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $column->string('action'); // e.g., 'auth.login', 'shop.purchase', 'market.listing_created'
            $column->nullableMorphs('target'); // target_id and target_type for polymorphic relationships
            $column->json('payload')->nullable(); // Additional details
            $column->string('ip_address', 45)->nullable();
            $column->text('user_agent')->nullable();
            $column->timestamp('created_at')->useCurrent();
            
            $column->index('action');
            $column->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
