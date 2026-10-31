<?php

namespace App\Services;

use App\Models\QuizAttempt;

class AdaptiveLearningService
{
    public function profile(?string $clientId): array
    {
        $attempts = $clientId ? QuizAttempt::query()->where('client_id', $clientId)->latest()->limit(5)->get() : collect();
        if ($attempts->isEmpty()) {
            return ['level' => 'Beginner', 'reason' => 'Starting with a clear foundation because no quiz history exists yet.', 'averageScore' => null];
        }
        $average = (int) round($attempts->avg(fn ($attempt) => $attempt->total ? ($attempt->score / $attempt->total) * 100 : 0));
        $level = match (true) {
            $average >= 82 => 'Advanced', $average >= 55 => 'Intermediate', default => 'Beginner'
        };

        return ['level' => $level, 'reason' => "Selected from the learner's recent {$average}% quiz average.", 'averageScore' => $average];
    }

    public function recommendation(int $score, int $total): string
    {
        $percentage = $total ? ($score / $total) * 100 : 0;

        return match (true) {
            $percentage >= 82 => 'Advanced', $percentage >= 55 => 'Intermediate', default => 'Beginner'
        };
    }
}
