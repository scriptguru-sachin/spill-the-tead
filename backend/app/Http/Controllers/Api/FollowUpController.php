<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreFollowUpRequest;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Services\AdaptiveLearningService;
use App\Services\GeminiLessonGenerator;

class FollowUpController extends Controller
{
    public function __invoke(StoreFollowUpRequest $request, Lesson $lesson, GeminiLessonGenerator $generator, AdaptiveLearningService $adaptive): LessonResource
    {
        $input = $request->validated();
        $profile = $adaptive->profile($input['client_id'] ?? $lesson->client_id);
        $weak = implode(', ', $input['weak_concepts'] ?? []);
        $context = match ($input['mode']) {
            'weak_spots' => "Adaptive remediation episode focused on these missed concepts: {$weak}. Correct misconceptions using fresh examples and verify them in the quiz.",
            'go_deeper' => 'Advanced sequel. Do not repeat basics; explore mechanisms, tradeoffs, edge cases, and deeper causal relationships.',
            'practical' => 'Practical sequel using one realistic end-to-end scenario, its decisions, consequences, and common failure modes.',
            'compare' => 'Comparison sequel contrasting this topic with '.($input['comparison_target'] ?? 'its closest alternative').'. Make selection criteria explicit.',
        };
        $generationInput = ['topic' => $lesson->topic, 'level' => $profile['level'], 'format' => $lesson->format, 'drama' => $lesson->drama, 'learning_context' => $context." Parent summary: {$lesson->topic_summary}"];
        $started = hrtime(true);
        $generated = $generator->generate($generationInput);
        $content = collect($generated)->except(['episodeTitle', 'topicSummary'])->all();
        $content['adaptiveProfile'] = [...$profile, 'requestedMode' => 'Adaptive follow-up'];
        $followUp = Lesson::create(['client_id' => $input['client_id'] ?? $lesson->client_id, 'parent_lesson_id' => $lesson->id, 'path_type' => $input['mode'], 'topic' => $lesson->topic, 'level' => $profile['level'], 'format' => $lesson->format, 'drama' => $lesson->drama, 'episode_title' => $generated['episodeTitle'], 'topic_summary' => $generated['topicSummary'], 'content' => $content, 'model' => config('services.gemini.model'), 'generation_ms' => (int) ((hrtime(true) - $started) / 1_000_000)]);

        return new LessonResource($followUp);
    }
}
