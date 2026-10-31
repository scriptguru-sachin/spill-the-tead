<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->uuid('client_id')->nullable()->index();
            $table->string('topic', 300);
            $table->string('level', 32);
            $table->string('format', 48);
            $table->unsignedTinyInteger('drama');
            $table->string('episode_title');
            $table->text('topic_summary');
            $table->jsonb('content');
            $table->string('model')->nullable();
            $table->unsignedInteger('generation_ms')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
