<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFeedbackRequest;
use App\Models\Lesson;
use Illuminate\Http\JsonResponse;

class FeedbackController extends Controller
{
    public function __invoke(StoreFeedbackRequest $request, Lesson $lesson): JsonResponse
    {
        $feedback = $lesson->feedback()->updateOrCreate(['client_id' => $request->validated('client_id')], $request->safe()->only(['helpful', 'comment']));

        return response()->json(['id' => $feedback->id, 'saved' => true]);
    }
}
