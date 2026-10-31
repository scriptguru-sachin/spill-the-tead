<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('teach_back_attempts', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('lesson_id')->constrained()->cascadeOnDelete();
            $table->uuid('client_id')->index();
            $table->text('response');
            $table->jsonb('ratings')->nullable();
            $table->jsonb('report')->nullable();
            $table->string('status', 20)->default('pending');
            $table->timestamps();

            $table->index(['lesson_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('teach_back_attempts');
    }
};
