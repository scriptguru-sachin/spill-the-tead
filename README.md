# ☕ Spill the Tea

> **Learn anything. Hear all about it.**
> An AI learning studio that turns difficult topics into fact-grounded, gossip-style conversations between the concepts themselves.

Type in a topic like *"Why does Redis make apps faster?"* and the real components become the cast. Redis is impatient and obsessed with speed, PostgreSQL is organised and protective of durable data, and the application is caught in the middle. Every character carries the real terminology, every joke is backed by a reality check, and every lesson ends with a quiz that shapes what you learn next.

---

## Table of contents

- [Why Spill the Tea?](#why-spill-the-tea)
- [Features](#features)
- [How it works](#how-it-works)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Data model](#data-model)
- [Testing](#testing)
- [Demo script](#demo-script)
- [Roadmap](#roadmap)

---

## Why Spill the Tea?

Complex topics are usually taught as dense, abstract definitions. Learners can recite a term without understanding how the pieces interact, and entertaining content often sacrifices accuracy.

Spill the Tea keeps both. **The humour is the delivery mechanism, not the source of truth.**

| Typical AI learning chat | Spill the Tea |
| --- | --- |
| One long answer | Guided, paced conversation |
| Generic assistant voice | Characters based on real concepts |
| Questions asked afterwards | Doubts attached to the exact message |
| Same difficulty for everyone | Difficulty adapts to quiz performance |
| Isolated answers | Linked follow-up episodes |
| Sources may be missing | Google Search grounding and source receipts |
| Text-only explanation | Story, facts, concept map, and quiz |

---

## Features

### 🎭 Lesson generation
- Enter any topic (2–300 characters).
- **Story styles:** Group chat, Courtroom debate, Reality show, Interview.
- **Drama level 1–5:** from calm and witty to maximum theatrical energy, with facts kept precise.
- **Levels:** Auto, Beginner, Intermediate, Advanced.
- Four one-click example topics for a quick start.
- Each lesson contains a cast, a 10–14 message conversation, reality checks, a concept map, a 4-question quiz, and 2–4 sources.

### 🧑‍🤝‍🧑 Concept-characters
- Characters are named after the real concept, component, process, or person, never invented human names.
- Each has a role, a personality derived from its real function, an intro line, an emoji avatar, and suggested doubts.

### 💬 Paced conversation player
- One message at a time with a typewriter effect, and the current speaker is highlighted on the stage.
- **Manual mode:** "I understand — next".
- **Autoplay:** reading time is calculated from message length.
- Previous/next controls and a progress bar.
- "Your turn to predict" prompts on selected messages.
- Message types: dialogue, stage direction, plot twist.
- At the end, a full ordered **transcript** with Replay.

### ❓ Doubts: ask the character
- Ask about the current message using suggested questions or your own (3–500 characters).
- The character answers in voice, using the lesson, its own profile, the reality checks, and the sources as context.
- Doubts are **saved beneath the exact message** that triggered them and appear in the transcript.
- An "Ask the Cast" section after the story lets you question any character.

### ✅ Reality check
- Facts are revealed one by one (click or autoplay).
- Each shows the actual meaning of a concept plus **"Where the analogy stops"**, so metaphors don't turn into misconceptions.

### 🗺️ Concept map
- An interactive [React Flow](https://reactflow.dev/) diagram with labelled, directional edges.
- A custom layout places nodes in columns by dependency depth.
- Nodes are colour-coded as starting point, core concept, or outcome.

### 📝 Quiz
- 4 reasoning-focused multiple-choice questions, each tagged with the concept it tests.
- Scored server-side and stored, with explanations for every answer.
- The result shows your score, weak concepts, a recommended level, and a recommended next action.

### 🧠 Adaptive learning
When **Auto** difficulty is selected, the average of your latest five quiz attempts sets the level:

| Recent average | Level |
| --- | --- |
| Below 55% | Beginner |
| 55–81% | Intermediate |
| 82% and above | Advanced |

With no history, lessons start at Beginner. After a quiz you can generate a **linked sequel episode**:

| Mode | What it does |
| --- | --- |
| `weak_spots` | Fresh examples targeting the concepts you missed |
| `go_deeper` | Mechanisms, tradeoffs, and edge cases, with no repeated basics |
| `practical` | One realistic end-to-end scenario with decisions and failure modes |
| `compare` | Contrasts the topic with its closest alternative |

### 🔎 Fact grounding
- Lessons use **Gemini with Google Search grounding**.
- Grounding metadata is retained: search queries, source URLs, and source count.
- A "Search grounded · N sources" badge and "Fact-check receipts" cards link to the sources.

### 🕘 History and feedback
- A sidebar with your 12 most recent lessons, which you can reopen anytime.
- Thumbs up/down feedback ("Did this make the topic click?"), stored once per lesson per learner.
- Responsive layout with a collapsible history panel and a mobile drawer menu.

---

## How it works

```text
React + Vite frontend
        │  JSON REST API
        ▼
Laravel 13 backend
   ├── Request validation
   ├── Prompt and grounding orchestration
   ├── Adaptive learning service
   ├── Response quality checks
   └── Lesson, quiz, feedback, doubt and follow-up APIs
        │
        ├──────────► Gemini + Google Search grounding
        ▼
PostgreSQL 17
```

**Creating a lesson (`POST /api/lessons`):**

1. `StoreLessonRequest` validates the input.
2. `AdaptiveLearningService` builds the learner profile. If the level is `Auto`, it resolves to a concrete level.
3. `LessonPrompt` builds a structured prompt with a JSON schema and editorial rules (real terminology, 3–8 map nodes, exactly 4 quiz questions, authoritative sources only, educational-only caveats for medical, legal, and financial topics).
4. `GeminiLessonGenerator` calls Gemini with the `google_search` tool (90 s timeout, 2 retries).
5. The response is validated server-side:
   - required keys must be present, with at least 2 characters and exactly 4 quiz questions;
   - messages from unknown characters are dropped;
   - concept-map edges that reference missing nodes are dropped.
6. Sources returned by Google Search grounding replace the model's self-reported sources.
7. The lesson, model name, and generation time are saved. A Gemini `429` returns a friendly "quota exhausted" message.

**Identity:** there is no login. The frontend generates a UUID (`client_id`) and keeps it in `localStorage`. It ties together history, quiz attempts, adaptive level, doubts, and feedback.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 18, Vite 6, `@xyflow/react` (concept map), `lucide-react` (icons) |
| Backend | Laravel 13 (PHP 8.3+), Eloquent API Resources, Form Requests |
| Database | PostgreSQL 17 (JSONB for lesson content) |
| AI | Google Gemini (`gemini-2.5-flash` by default) with Google Search grounding |
| Infrastructure | Docker Compose (API + PostgreSQL) |
| Testing | PHPUnit 12 |

---

## Project structure

```text
spill-the-tea/
├── client/                      # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # UI: landing, player, facts, map, quiz, doubts
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── vite.config.js           # Dev server on :5173, proxies /api → :8000
│   └── .env.example
├── backend/                     # Laravel JSON API
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/ # Lesson, QuizAttempt, Feedback, Doubt, FollowUp
│   │   │   ├── Requests/        # Validation rules
│   │   │   └── Resources/       # LessonResource
│   │   ├── Models/              # Lesson, QuizAttempt, Feedback, Doubt
│   │   └── Services/
│   │       ├── LessonPrompt.php
│   │       ├── GeminiLessonGenerator.php
│   │       ├── DoubtAnswerer.php
│   │       └── AdaptiveLearningService.php
│   ├── database/migrations/
│   ├── routes/api.php
│   ├── tests/Feature/LessonApiTest.php
│   └── .env.example
├── docker-compose.yml           # API (:8000) + PostgreSQL (host :5433)
├── PRESENTATION.md
└── PITCH_SCRIPT.md
```

---

## Getting started

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose
- [Node.js](https://nodejs.org/) 18+ and npm
- A [Gemini API key](https://aistudio.google.com/app/apikey). Search grounding uses the key's project quota and may need billing enabled.

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `backend/.env` and set:

```env
GEMINI_API_KEY=your_key_here
```

The database settings in `.env.example` already match `docker-compose.yml`.

### 2. Start the API and database

```bash
# from the repository root
docker compose up --build
```

This starts PostgreSQL 17, installs Composer dependencies, runs migrations, and serves the API at **http://localhost:8000/api**.

`APP_KEY` is blank in `.env.example`. If Laravel complains about a missing application key, generate one while the containers are running:

```bash
docker compose exec api php artisan key:generate
```

### 3. Start the frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api` to Laravel, so no extra configuration is needed locally.

### 4. Verify

```bash
curl http://localhost:8000/api/health
# {"ok":true,"service":"spill-the-tea-api","model":"gemini-2.5-flash"}
```

### Production build

```bash
cd client
npm run build     # outputs client/dist
```

When hosting the frontend separately, copy `client/.env.example` to `client/.env` and set `VITE_API_URL` to your API's public URL. Set `FRONTEND_URL` in the backend `.env` so CORS allows it.

---

## Configuration

### Backend (`backend/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `GEMINI_API_KEY` | none | **Required.** Google Gemini API key. |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model used for lessons and doubts. |
| `FRONTEND_URL` | `http://localhost:5173` | Allowed CORS origin. |
| `DB_CONNECTION` | `pgsql` | Database driver. |
| `DB_HOST` | `db` | Database host (Docker service name). |
| `DB_PORT` | `5432` | Database port inside the Docker network. |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | `spill_the_tea` / `spill` / `spill_secret` | Must match `docker-compose.yml`. |
| `APP_KEY` | blank | Generate with `php artisan key:generate`. |

> PostgreSQL is also published on the host at port **5433**, in case you want to connect with a database client.

### Frontend (`client/.env`)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base URL. Only needed when the frontend is hosted separately from the proxy. |

---

## API reference

Base URL: `http://localhost:8000/api`. All responses are JSON.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/health` | Service health and active model |
| `GET` | `/lessons?client_id={uuid}&limit={1-30}` | Recent lesson history (default limit 12) |
| `POST` | `/lessons` | Generate and persist a lesson |
| `GET` | `/lessons/{id}` | Retrieve a lesson |
| `POST` | `/lessons/{id}/quiz-attempts` | Score and persist a quiz attempt |
| `POST` | `/lessons/{id}/feedback` | Save thumbs up/down feedback |
| `POST` | `/lessons/{id}/follow-ups` | Generate an adaptive sequel |
| `GET` | `/lessons/{id}/doubts?client_id={uuid}` | Load saved doubts |
| `POST` | `/lessons/{id}/doubts` | Ask a character a doubt |

### Create a lesson

`POST /lessons`

```json
{
  "client_id": "b7bd2ea5-a7ca-46de-b4e6-69d1a683389f",
  "topic": "Why does Redis make apps faster?",
  "level": "Auto",
  "format": "Group chat",
  "drama": 3
}
```

| Field | Rules |
| --- | --- |
| `client_id` | Optional UUID |
| `topic` | Required, 2–300 characters |
| `level` | `Auto`, `Beginner`, `Intermediate`, `Advanced` |
| `format` | `Group chat`, `Courtroom debate`, `Reality show`, `Interview` |
| `drama` | Integer 1–5 |

**Response (`201`)**, shortened:

```json
{
  "data": {
    "id": "uuid",
    "parentLessonId": null,
    "pathType": "original",
    "topic": "...",
    "level": "Beginner",
    "episodeTitle": "...",
    "topicSummary": "...",
    "characters": [{ "id": "redis", "name": "Redis", "role": "...", "personality": "...", "intro": "...", "avatar": "⚡", "quickDoubts": ["..."] }],
    "conversation": [{ "id": "m1", "characterId": "redis", "text": "...", "kind": "dialogue", "reflectionPrompt": "..." }],
    "realityCheck": [{ "concept": "...", "actualMeaning": "...", "analogyLimit": "..." }],
    "visualization": { "title": "...", "description": "...", "nodes": [], "edges": [] },
    "quiz": [{ "concept": "...", "question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0, "explanation": "..." }],
    "sources": [{ "title": "...", "publisher": "...", "url": "https://...", "supports": "..." }],
    "grounding": { "enabled": true, "searchQueries": [], "sourceCount": 3 },
    "adaptiveProfile": { "level": "Beginner", "reason": "...", "averageScore": null, "requestedMode": "Auto" }
  }
}
```

### Submit a quiz attempt

`POST /lessons/{id}/quiz-attempts`

```json
{ "client_id": "uuid", "answers": [0, 2, 1, 3] }
```

The answers array must contain one value (0–3) per question.

```json
{
  "id": 1,
  "score": 3,
  "total": 4,
  "percentage": 75,
  "recommendedLevel": "Intermediate",
  "weakConcepts": ["Cache invalidation"],
  "nextBestAction": "weak_spots"
}
```

### Generate a follow-up episode

`POST /lessons/{id}/follow-ups`

```json
{
  "client_id": "uuid",
  "mode": "weak_spots",
  "weak_concepts": ["Cache invalidation"],
  "comparison_target": "Memcached"
}
```

`mode` is one of `weak_spots`, `go_deeper`, `practical`, `compare`. `weak_concepts` takes up to 4 items, and `comparison_target` is only used by `compare`.

### Ask a doubt

`POST /lessons/{id}/doubts`

```json
{
  "client_id": "uuid",
  "message_id": "m3",
  "character_id": "redis",
  "question": "Why is in-memory storage faster?"
}
```

### Save feedback

`POST /lessons/{id}/feedback`

```json
{ "client_id": "uuid", "helpful": true, "comment": "Optional, up to 1000 characters" }
```

### Errors

Validation errors return `422` with Laravel's standard `errors` object. When the Gemini Search quota is exhausted, the API returns `429` with `{ "message": "...", "retryable": true }`.

---

## Data model

| Table | Purpose |
| --- | --- |
| `lessons` | UUID primary key, `client_id`, topic, level, format, drama, episode title and summary, `content` (JSONB), model, `generation_ms`, `parent_lesson_id` (self-reference), `path_type` |
| `quiz_attempts` | Lesson reference, `client_id`, answers (JSONB), score, total |
| `feedback` | Lesson reference, `client_id`, `helpful`, comment. Unique per `(lesson_id, client_id)` |
| `doubts` | Lesson reference, `client_id`, `message_id`, `character_id`, question, answer |

Follow-up episodes link to their parent through `parent_lesson_id`, with `path_type` set to `original`, `weak_spots`, `go_deeper`, `practical`, or `compare`.

---

## Testing

```bash
# Backend
docker compose exec api php artisan test

# Frontend build check
cd client && npm run build
```

The suite covers the health endpoint, lesson creation and validation (with a faked Gemini response), and doubt persistence.

---

## Demo script

**Recommended topic:** *How your browser loads a website*

1. Choose **Auto** difficulty, **Group chat**, drama **4**.
2. Meet the cast: Browser, DNS, TCP, TLS, Server, Cache.
3. Play two messages in autoplay.
4. Pause and ask DNS a doubt about translating domain names.
5. Show the Reality check and the concept map.
6. Take the quiz, answering one question wrong on purpose.
7. Click **Fix my weak spots**.
8. Show the grounded sources and the linked follow-up in history.

**Backup topics:** TCP vs UDP during a live concert · CRISPR enters the cell's group chat · The French Revolution as a courtroom trial

---

## Roadmap

- Voice acting and accessible subtitles for each character
- Teacher and classroom rooms with aggregate quiz insights
- Spaced-repetition reviews based on weak concepts
- Teach-back mode where the learner explains the topic to the cast
- Shareable public episodes and PDF/flashcard exports
- Multilingual stories with localised humour
- Progress dashboard with streaks and mastery

---

<p align="center"><b>Spill the Tea</b> · Learning, but make it memorable.</p>
