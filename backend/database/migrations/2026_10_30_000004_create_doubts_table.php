<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('doubts', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('lesson_id')->constrained()->cascadeOnDelete();
            $table->uuid('client_id')->nullable()->index();
            $table->string('message_id', 120)->nullable()->index();
            $table->string('character_id', 120);
            $table->text('question');
            $table->text('answer');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('doubts');
    }
};
