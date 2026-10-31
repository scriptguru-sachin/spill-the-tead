<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feedback', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('lesson_id')->constrained()->cascadeOnDelete();
            $table->uuid('client_id')->nullable()->index();
            $table->boolean('helpful');
            $table->text('comment')->nullable();
            $table->timestamps();
            $table->unique(['lesson_id', 'client_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback');
    }
};
