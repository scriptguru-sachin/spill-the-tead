<?php

namespace App\Services;

use App\Models\Lesson;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class TeachBackReviewer
{
    public function review(Lesson $lesson, string $response): array
    {
        $key = config('services.gemini.key');
        if (! $key) {
            throw new RuntimeException('Gemini API key is not configured.');
        }

        $context = json_encode([
            'topic' => $lesson->topic,
            'level' => $lesson->level,
            'summary' => $lesson->topic_summary,
            'key_concepts' => $lesson->content['realityCheck'] ?? [],
            'technical_explanation' => $lesson->content['technicalExplanation'] ?? null,
        ], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
        $prompt = <<<PROMPT
You are an encouraging learning coach. Review the learner's explanation against the lesson's facts and the learner's level. Ratings are formative guidance, not grades: use integers from 1 to 5, where 1 means "needs more support" and 5 means "clear and accurate". Be fair to a short response; do not penalize spelling or writing style. Do not invent claims about what the learner wrote.

Return JSON only with exactly this structure:
{
  "ratings": {
    "accuracy": 1,
    "completeness": 1,
    "clarity": 1
  },
  "report": {
    "summary": "A concise, supportive overview",
    "strengths": ["A specific thing the learner explained accurately"],
    "gaps": ["A key idea that is missing or unclear, if any"],
    "correction": "A gentle correction, or an empty string if none is needed",
    "next_step": "One practical suggestion for revising the explanation"
  }
}

Use 1–5 for every rating. Include one or two strengths and gaps; if there are no meaningful gaps, say so plainly in one gap item. Keep each report field concise and appropriate for the learner level.

LESSON: {$context}
LEARNER'S OWN EXPLANATION: {$response}
PROMPT;
        $model = config('services.gemini.model');
        $responseBody = Http::timeout(60)->retry(2, 400)->post(
            "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent?key={$key}",
            [
                'contents' => [['parts' => [['text' => $prompt]]]],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.3,
                ],
            ],
        )->throw();

        $raw = data_get($responseBody->json(), 'candidates.0.content.parts.0.text');
        $review = json_decode((string) $raw, true, 512, JSON_THROW_ON_ERROR);
        $this->validateReview($review);

        return $review;
    }

    private function validateReview(mixed $review): void
    {
        $criteria = ['accuracy', 'completeness', 'clarity'];
        $ratings = is_array($review) ? ($review['ratings'] ?? null) : null;
        if (! is_array($ratings)) {
            throw new RuntimeException('The teach-back review did not include valid ratings.');
        }

        foreach ($criteria as $criterion) {
            if (! isset($ratings[$criterion]) || ! is_int($ratings[$criterion]) || $ratings[$criterion] < 1 || $ratings[$criterion] > 5) {
                throw new RuntimeException('The teach-back review included an invalid rating.');
            }
        }

        $report = $review['report'] ?? null;
        if (! is_array($report)) {
            throw new RuntimeException('The teach-back review did not include a valid report.');
        }
        foreach (['summary', 'correction', 'next_step'] as $field) {
            if (! isset($report[$field]) || ! is_string($report[$field])) {
                throw new RuntimeException('The teach-back report is incomplete.');
            }
        }
        foreach (['strengths', 'gaps'] as $field) {
            if (! isset($report[$field]) || ! is_array($report[$field]) || ! collect($report[$field])->every(fn ($item) => is_string($item))) {
                throw new RuntimeException('The teach-back report is incomplete.');
            }
        }
    }
}
