<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TeachBackAttempt extends Model
{
    protected $fillable = ['lesson_id', 'client_id', 'response', 'ratings', 'report', 'status'];

    protected function casts(): array
    {
        return ['ratings' => 'array', 'report' => 'array'];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
