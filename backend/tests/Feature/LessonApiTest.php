<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class LessonApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_health_endpoint_is_available(): void
    {
        $this->getJson('/api/health')->assertOk()->assertJsonPath('ok', true);
    }

    public function test_a_generated_lesson_is_validated_and_persisted(): void
    {
        config(['services.gemini.key' => 'test-key']);
        Http::fakeSequence()
            ->push(['candidates' => [['content' => ['parts' => [['text' => json_encode($this->lessonPayload())]]]]]])
            ->push(['candidates' => [['content' => ['parts' => [['text' => json_encode(['answer' => 'A request asks the server for a resource.'])]]]]]]);
        $response = $this->postJson('/api/lessons', ['client_id' => 'b7bd2ea5-a7ca-46de-b4e6-69d1a683389f', 'topic' => 'How APIs work', 'level' => 'Beginner', 'format' => 'Group chat', 'drama' => 3]);
        $response->assertCreated()->assertJsonPath('data.topic', 'How APIs work')->assertJsonCount(4, 'data.quiz');
        $this->assertDatabaseHas('lessons', ['topic' => 'How APIs work']);

        $this->postJson('/api/lessons/'.$response->json('data.id').'/doubts', [
            'client_id' => 'b7bd2ea5-a7ca-46de-b4e6-69d1a683389f',
            'message_id' => 'm1',
            'character_id' => 'client',
            'question' => 'What exactly is a request?',
        ])->assertCreated()->assertJsonPath('message_id', 'm1');
        $this->assertDatabaseHas('doubts', ['message_id' => 'm1', 'character_id' => 'client']);
    }

    private function lessonPayload(): array
    {
        $questions = array_fill(0, 4, ['question' => 'What happens?', 'options' => ['A', 'B', 'C', 'D'], 'correctIndex' => 0, 'explanation' => 'Because A.']);

        return ['episodeTitle' => 'The Request Has Receipts', 'topicSummary' => 'A concise API lesson.', 'characters' => [['id' => 'client', 'name' => 'Client', 'role' => 'Requester', 'personality' => 'Curious', 'intro' => 'I need data.', 'avatar' => '📱', 'quickDoubts' => ['What do you send?']], ['id' => 'server', 'name' => 'Server', 'role' => 'Responder', 'personality' => 'Reliable', 'intro' => 'I can help.', 'avatar' => '🖥️', 'quickDoubts' => ['How do you respond?']]], 'conversation' => [['id' => 'm1', 'characterId' => 'client', 'text' => 'I send a request.', 'kind' => 'dialogue']], 'realityCheck' => [['concept' => 'Request', 'actualMeaning' => 'A message from a client.', 'analogyLimit' => 'It is not human speech.']], 'visualization' => ['title' => 'Request flow', 'description' => 'Client to server', 'nodes' => [['id' => 'client', 'label' => 'Client', 'detail' => 'Sends', 'type' => 'input'], ['id' => 'server', 'label' => 'Server', 'detail' => 'Responds', 'type' => 'output']], 'edges' => [['id' => 'e1', 'source' => 'client', 'target' => 'server', 'label' => 'request']]], 'quiz' => $questions, 'sources' => [['title' => 'HTTP Semantics', 'publisher' => 'IETF', 'url' => 'https://www.rfc-editor.org/rfc/rfc9110', 'supports' => 'HTTP requests and responses']]];
    }
}
