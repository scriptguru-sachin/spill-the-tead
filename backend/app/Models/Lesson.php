<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Lesson extends Model
{
    use HasUuids;

    protected $fillable = ['client_id', 'parent_lesson_id', 'path_type', 'topic', 'level', 'format', 'drama', 'episode_title', 'topic_summary', 'content', 'model', 'generation_ms'];

    protected function casts(): array
    {
        return ['content' => 'array', 'drama' => 'integer'];
    }

    public function quizAttempts(): HasMany
    {
        return $this->hasMany(QuizAttempt::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function doubts(): HasMany
    {
        return $this->hasMany(Doubt::class);
    }
}
