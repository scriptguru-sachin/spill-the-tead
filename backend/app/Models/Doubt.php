<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Doubt extends Model
{
    protected $fillable = ['lesson_id', 'client_id', 'message_id', 'character_id', 'question', 'answer'];

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
