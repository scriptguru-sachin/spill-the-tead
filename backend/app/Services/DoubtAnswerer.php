<?php

namespace App\Services;

use App\Models\Lesson;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class DoubtAnswerer
{
    public function answer(Lesson $lesson, string $characterId, string $question): array
    {
        $characters = collect($lesson->content['characters'] ?? []);
        $character = $characters->firstWhere('id', $characterId);
        if (! $character) {
            throw new RuntimeException('That character is not part of this lesson.');
        }

        $key = config('services.gemini.key');
        if (! $key) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $context = json_encode([
            'topic' => $lesson->topic,
            'level' => $lesson->level,
            'summary' => $lesson->topic_summary,
            'character' => $character,
            'realityCheck' => $lesson->content['realityCheck'] ?? [],
            'sources' => $lesson->content['sources'] ?? [],
        ], JSON_UNESCAPED_SLASHES);
        $prompt = "Answer the learner's doubt as the educational character in the context. Keep the character voice, but be factually precise and clear for the learner level. Correct false premises gently. Use 2-4 short paragraphs and no markdown. Never claim the metaphor is literal. Return JSON only as {\"answer\":\"...\"}. CONTEXT: {$context} QUESTION: {$question}";
        $model = config('services.gemini.model');
        $response = Http::timeout(60)->retry(2, 400)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
            ['contents' => [['parts' => [['text' => $prompt]]]], 'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.4]],
        )->throw();
        $raw = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $answer = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR)['answer'] ?? null;
        if (! $answer) {
            throw new RuntimeException('I could not answer that doubt. Please try again.');
        }

        return ['characterId' => $characterId, 'answer' => $answer];
    }
}
