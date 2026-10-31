<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->foreignUuid('parent_lesson_id')->nullable()->after('client_id')->constrained('lessons')->nullOnDelete();
            $table->string('path_type', 40)->default('original')->after('parent_lesson_id');
        });
    }

    public function down(): void
    {
        Schema::table('lessons', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('parent_lesson_id');
            $table->dropColumn('path_type');
        });
    }
};
