<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreQuizAttemptRequest;
use App\Models\Lesson;
use App\Services\AdaptiveLearningService;
use Illuminate\Http\JsonResponse;

class QuizAttemptController extends Controller
{
    public function __invoke(StoreQuizAttemptRequest $request, Lesson $lesson, AdaptiveLearningService $adaptive): JsonResponse
    {
        $answers = $request->validated('answers');
        $quiz = $lesson->content['quiz'] ?? [];
        abort_if(count($answers) !== count($quiz), 422, 'Answer every question before submitting.');
        $score = collect($quiz)->filter(fn ($question, $index) => ($answers[$index] ?? null) === ($question['correctIndex'] ?? null))->count();
        $weakConcepts = collect($quiz)->filter(fn ($question, $index) => ($answers[$index] ?? null) !== ($question['correctIndex'] ?? null))->map(fn ($question) => $question['concept'] ?? $question['question'])->values()->all();
        $attempt = $lesson->quizAttempts()->create(['client_id' => $request->validated('client_id'), 'answers' => $answers, 'score' => $score, 'total' => count($quiz)]);

        return response()->json(['id' => $attempt->id, 'score' => $score, 'total' => count($quiz), 'percentage' => count($quiz) ? (int) round($score / count($quiz) * 100) : 0, 'recommendedLevel' => $adaptive->recommendation($score, count($quiz)), 'weakConcepts' => $weakConcepts, 'nextBestAction' => $weakConcepts === [] ? 'go_deeper' : 'weak_spots'], 201);
    }
}
