<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeachBackAttemptRequest;
use App\Models\Lesson;
use App\Services\TeachBackReviewer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Throwable;

class TeachBackAttemptController extends Controller
{
    public function index(Request $request, Lesson $lesson): JsonResponse
    {
        $input = $request->validate(['client_id' => ['required', 'uuid']]);
        abort_unless(
            $lesson->client_id && hash_equals($lesson->client_id, $input['client_id']),
            404,
        );
        $attempts = $lesson->teachBackAttempts()
            ->where('client_id', $input['client_id'])
            ->oldest()
            ->get(['id', 'response', 'ratings', 'report', 'status', 'created_at']);

        return response()->json($attempts);
    }

    public function store(
        StoreTeachBackAttemptRequest $request,
        Lesson $lesson,
        TeachBackReviewer $reviewer,
    ): JsonResponse {
        abort_unless(
            $lesson->client_id && hash_equals($lesson->client_id, $request->validated('client_id')),
            404,
        );
        $attempt = $lesson->teachBackAttempts()->create([
            'client_id' => $request->validated('client_id'),
            'response' => $request->validated('response'),
            'status' => 'pending',
        ]);

        try {
            $review = $reviewer->review($lesson, $attempt->response);
        } catch (Throwable $exception) {
            $attempt->update(['status' => 'failed']);
            throw $exception;
        }

        $attempt->update([
            'ratings' => $review['ratings'],
            'report' => $review['report'],
            'status' => 'completed',
        ]);
        $attempt->refresh();

        return response()->json($attempt->only([
            'id',
            'response',
            'ratings',
            'report',
            'status',
            'created_at',
        ]), 201);
    }
}
