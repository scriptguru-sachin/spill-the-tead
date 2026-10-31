<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parentLessonId' => $this->parent_lesson_id,
            'pathType' => $this->path_type,
            'topic' => $this->topic,
            'level' => $this->level,
            'format' => $this->format,
            'drama' => $this->drama,
            'episodeTitle' => $this->episode_title,
            'topicSummary' => $this->topic_summary,
            ...$this->content,
            'createdAt' => $this->created_at?->toISOString(),
        ];
    }
}
