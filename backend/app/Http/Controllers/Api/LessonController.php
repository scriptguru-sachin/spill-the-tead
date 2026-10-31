<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLessonRequest;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Services\AdaptiveLearningService;
use App\Services\GeminiLessonGenerator;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class LessonController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate(['client_id' => ['nullable', 'uuid'], 'limit' => ['nullable', 'integer', 'between:1,30']]);
        $lessons = Lesson::query()
            ->when($request->string('client_id')->isNotEmpty(), fn ($query) => $query->where('client_id', $request->string('client_id')))
            ->latest()->limit((int) $request->input('limit', 12))->get();

        return LessonResource::collection($lessons);
    }

    public function store(StoreLessonRequest $request, GeminiLessonGenerator $generator, AdaptiveLearningService $adaptive): LessonResource
    {
        $input = $request->validated();
        $requestedLevel = $input['level'];
        $profile = $adaptive->profile($input['client_id'] ?? null);
        if ($requestedLevel === 'Auto') {
            $input['level'] = $profile['level'];
        }
        $input['learning_context'] = $requestedLevel === 'Auto' ? $profile['reason'].' Adapt vocabulary, examples, pacing, and quiz challenge to this evidence.' : "The learner explicitly selected {$input['level']}.";
        $started = hrtime(true);
        $generated = $generator->generate($input);
        $content = collect($generated)->except(['episodeTitle', 'topicSummary'])->all();
        $content['adaptiveProfile'] = [...$profile, 'requestedMode' => $requestedLevel];
        $lesson = Lesson::create([
            ...$input,
            'episode_title' => $generated['episodeTitle'],
            'topic_summary' => $generated['topicSummary'],
            'content' => $content,
            'model' => config('services.gemini.model'),
            'generation_ms' => (int) ((hrtime(true) - $started) / 1_000_000),
        ]);

        return new LessonResource($lesson);
    }

    public function show(Lesson $lesson): LessonResource
    {
        return new LessonResource($lesson);
    }
}
