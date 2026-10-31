<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AskDoubtRequest;
use App\Models\Lesson;
use App\Services\DoubtAnswerer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoubtController extends Controller
{
    public function index(Request $request, Lesson $lesson): JsonResponse
    {
        $request->validate(['client_id' => ['nullable', 'uuid']]);
        $doubts = $lesson->doubts()
            ->when($request->filled('client_id'), fn ($query) => $query->where('client_id', $request->string('client_id')))
            ->oldest()->get(['id', 'message_id', 'character_id', 'question', 'answer', 'created_at']);

        return response()->json($doubts);
    }

    public function store(AskDoubtRequest $request, Lesson $lesson, DoubtAnswerer $answerer): JsonResponse
    {
        $result = $answerer->answer($lesson, $request->validated('character_id'), $request->validated('question'));
        $doubt = $lesson->doubts()->create([
            'client_id' => $request->validated('client_id'),
            'message_id' => $request->validated('message_id'),
            'character_id' => $request->validated('character_id'),
            'question' => $request->validated('question'),
            'answer' => $result['answer'],
        ]);

        return response()->json([
            'id' => $doubt->id,
            'message_id' => $doubt->message_id,
            'characterId' => $doubt->character_id,
            'question' => $doubt->question,
            'answer' => $doubt->answer,
            'createdAt' => $doubt->created_at->toISOString(),
        ], 201);
    }
}
