<?php

use App\Http\Controllers\Api\DoubtController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\FollowUpController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\QuizAttemptController;
use App\Http\Controllers\Api\TeachBackAttemptController;
use Illuminate\Support\Facades\Route;

Route::get('/health', fn () => response()->json([
    'ok' => true,
    'service' => 'spill-the-tea-api',
    'model' => config('services.gemini.model'),
]));

Route::apiResource('lessons', LessonController::class)->only(['index', 'store', 'show']);
Route::post('lessons/{lesson}/quiz-attempts', QuizAttemptController::class);
Route::post('lessons/{lesson}/feedback', FeedbackController::class);
Route::post('lessons/{lesson}/follow-ups', FollowUpController::class);
Route::get('lessons/{lesson}/doubts', [DoubtController::class, 'index']);
Route::post('lessons/{lesson}/doubts', [DoubtController::class, 'store']);
Route::get('lessons/{lesson}/teach-back-attempts', [TeachBackAttemptController::class, 'index']);
Route::post('lessons/{lesson}/teach-back-attempts', [TeachBackAttemptController::class, 'store']);
