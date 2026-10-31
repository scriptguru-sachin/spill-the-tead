<?php

namespace App\Services;

class LessonPrompt
{
    public function build(array $input): string
    {
        $schema = json_encode($this->schema(), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
        $dramaGuidance = match ((int) $input['drama']) {
            1 => 'Warm and calm. Use light wit, no conflict.',
            2 => 'Playful, with one mild disagreement.',
            3 => 'Lively banter and a clear reveal.',
            4 => 'High-energy disagreements and two memorable reveals.',
            5 => 'Maximum theatrical energy, while every factual claim remains precise.',
        };
        $learningContext = $input['learning_context'] ?? 'This is the learner’s first episode on this topic.';

        return <<<PROMPT
You are the senior educational writer and fact editor for "Spill the Tea". Turn the requested topic into memorable character-driven teaching. Entertainment serves understanding; it never replaces it.

INPUT
- Topic: {$input['topic']}
- Learner level: {$input['level']}
- Format: {$input['format']}
- Drama: {$input['drama']}/5 — {$dramaGuidance}
- Adaptive learning context: {$learningContext}

OUTPUT CONTRACT
Return only valid JSON matching this shape exactly:
{$schema}

EDITORIAL METHOD
1. Silently identify the 3–7 essential concepts, their causal relationships, and likely misconceptions.
2. Character names must be the real concept, component, process, institution, or historical person they represent. Never replace terminology with invented human names. Give each character 2 short quickDoubts a learner would naturally ask that specific character.
3. Give each character a distinct voice derived from its real function. Make every exchange teach: claim → reaction → clarification or consequence.
4. Write 10–14 concise messages. Include a concrete scenario, a useful disagreement rooted in real distinctions, and a recap near the end.
5. Respect the requested format in pacing and stage directions. All characterId values must reference an existing character id.
6. Reality checks must separate metaphor from fact, state important limits, and flag nuance or contested interpretations.
7. The concept map needs 3–8 nodes. Every edge must reference existing node ids and represent a real relationship; do not invent a sequence for a non-sequential topic.
8. Write exactly 4 reasoning-focused quiz questions, each with four plausible options, one zero-based correctIndex, a concept field naming the skill tested, and an explanation that teaches why.
9. For broad topics, choose and disclose a manageable foundational scope. For medical, legal, financial, or safety topics, include an educational-only caveat in topicSummary.
10. Add 2–4 fact-check sources from authoritative first-party, university, museum, peer-reviewed, government, or standards-organization pages. Use real canonical HTTPS URLs, never invented URLs, blogs, aggregators, search pages, or Wikipedia. The title and publisher must honestly identify the linked page.
11. Avoid filler, fake quotations, unsupported dates/statistics, HTML, Markdown, and executable code.

FINAL SILENT CHECK
Verify terminology, chronology/causality, character references, diagram edges, quiz indices, and that jokes cannot be mistaken for literal facts.
PROMPT;
    }

    private function schema(): array
    {
        return [
            'episodeTitle' => 'string', 'topicSummary' => 'string',
            'characters' => [['id' => 'kebab-case string', 'name' => 'real concept name', 'role' => 'factual function', 'personality' => 'voice based on function', 'intro' => 'short in-character line', 'avatar' => 'one emoji', 'quickDoubts' => ['short question', 'short question']]],
            'conversation' => [['id' => 'string', 'characterId' => 'existing id', 'text' => 'string', 'kind' => 'dialogue | stage_direction | plot_twist', 'reflectionPrompt' => 'optional short prediction question for the learner']],
            'realityCheck' => [['concept' => 'string', 'actualMeaning' => 'string', 'analogyLimit' => 'string']],
            'visualization' => ['title' => 'string', 'description' => 'string', 'nodes' => [['id' => 'string', 'label' => 'string', 'detail' => 'string', 'type' => 'input | default | output']], 'edges' => [['id' => 'string', 'source' => 'node id', 'target' => 'node id', 'label' => 'relationship']]],
            'quiz' => [['concept' => 'specific skill or concept', 'question' => 'string', 'options' => ['string', 'string', 'string', 'string'], 'correctIndex' => 0, 'explanation' => 'string']],
            'sources' => [['title' => 'specific page title', 'publisher' => 'trusted organization', 'url' => 'canonical https URL', 'supports' => 'what claim this verifies']],
        ];
    }
}
