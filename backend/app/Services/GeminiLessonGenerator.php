<?php

namespace App\Services;

use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Exceptions\HttpResponseException;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class GeminiLessonGenerator
{
    public function __construct(private readonly LessonPrompt $prompt) {}

    public function generate(array $input): array
    {
        $key = config('services.gemini.key');
        $model = config('services.gemini.model');
        if (! $key) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $payload = [
            'contents' => [['parts' => [['text' => $this->prompt->build($input)]]]],
            'generationConfig' => ['responseMimeType' => 'application/json', 'temperature' => 0.65],
        ];
        if (config('services.gemini.grounding_enabled')) {
            $payload['tools'] = [['google_search' => (object) []]];
        }

        try {
            $response = Http::timeout(90)->retry(2, 500)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
                $payload,
            )->throw();
        } catch (RequestException $exception) {
            if ($exception->response->status() === 429) {
                throw new HttpResponseException(response()->json([
                    'message' => 'Gemini API quota is currently exhausted. Check the model quota and, if enabled, Google Search grounding quota, or try again later.',
                    'retryable' => true,
                ], 429));
            }

            throw $exception;
        }

        $raw = data_get($response->json(), 'candidates.0.content.parts.0.text');
        $data = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
        $this->validateShape($data);

        $characterIds = collect($data['characters'])->pluck('id')->all();
        $data['conversation'] = array_values(array_filter($data['conversation'], fn ($message) => in_array($message['characterId'] ?? null, $characterIds, true)));
        $nodeIds = collect($data['visualization']['nodes'])->pluck('id')->all();
        $data['visualization']['edges'] = array_values(array_filter($data['visualization']['edges'], fn ($edge) => in_array($edge['source'] ?? null, $nodeIds, true) && in_array($edge['target'] ?? null, $nodeIds, true)));
        $grounding = data_get($response->json(), 'candidates.0.groundingMetadata', []);
        $groundedSources = collect($grounding['groundingChunks'] ?? [])->pluck('web')->filter()->map(fn ($source) => [
            'title' => $source['title'] ?? parse_url($source['uri'] ?? '', PHP_URL_HOST),
            'publisher' => parse_url($source['uri'] ?? '', PHP_URL_HOST) ?: 'Google Search source',
            'url' => $source['uri'] ?? '',
            'supports' => 'Used by Gemini to ground factual claims in this lesson.',
        ])->filter(fn ($source) => filled($source['url']))->unique('url')->values()->all();
        if ($groundedSources !== []) {
            $data['sources'] = $groundedSources;
        }
        $searchQueries = $grounding['webSearchQueries'] ?? [];
        $data['grounding'] = [
            'enabled' => $groundedSources !== [] || $searchQueries !== [],
            'searchQueries' => $searchQueries,
            'sourceCount' => count($groundedSources),
        ];

        return $data;
    }

    private function validateShape(array $data): void
    {
        foreach (['episodeTitle', 'topicSummary', 'characters', 'conversation', 'realityCheck', 'visualization', 'quiz', 'sources'] as $key) {
            if (! array_key_exists($key, $data)) {
                throw new RuntimeException('The AI returned an incomplete lesson. Please try again.');
            }
        }
        if (count($data['characters']) < 2 || count($data['quiz']) !== 4) {
            throw new RuntimeException('The AI response did not pass quality checks. Please try again.');
        }
    }
}
