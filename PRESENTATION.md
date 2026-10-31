# Spill the Tea

## Learn anything through gossip

**Hackathon presentation · 7–9 minutes**

> Complex ideas become memorable conversations—grounded in facts, adapted to the learner, and delivered with just enough drama.

**Opening line:** What if Redis, PostgreSQL, and your application could explain caching by arguing about who actually does the most work?

---

# 1. The problem

## Learning complex topics should not feel like decoding a manual

- Traditional explanations are dense, abstract, and full of unfamiliar terminology.
- Learners often understand a definition without understanding how concepts interact.
- Generic lessons do not adapt when a learner is confused or already knows the basics.
- Entertaining educational content can be memorable, but it often sacrifices accuracy.

**Speaker note:** The real problem is not access to information. It is attention, comprehension, and retention. Learners need explanations they want to follow—and can trust.

---

# 2. Our solution

## A learning platform where the concepts become the cast

The learner enters any topic. Spill the Tea transforms its real components into distinctive characters inside a guided conversation.

- Character names preserve the real terminology.
- Personalities are based on each concept's actual function.
- Conflict reveals relationships, tradeoffs, and misconceptions.
- Reality checks separate metaphor from literal fact.
- Concept maps, quizzes, citations, and doubts reinforce the lesson.

**Example:** Redis is impatient and obsessed with speed. PostgreSQL is organized and protective of durable data. Their disagreement teaches caching more clearly than a paragraph of definitions.

---

# 3. The learning experience

## From curiosity to understanding

1. **Choose a topic** — or start with a curated demonstration topic.
2. **Set the experience** — story format, drama level, and adaptive difficulty.
3. **Meet the cast** — every character represents a real concept.
4. **Follow the gossip** — one speaker at a time with guided or autoplay pacing.
5. **Interrupt with doubts** — ask any character about the current message.
6. **Check the receipts** — review facts, analogy limits, sources, and concept maps.
7. **Take the quiz** — identify strengths and misconceptions.
8. **Continue the story** — receive an adaptive follow-up episode.

**Speaker note:** The product is not simply an AI response with a fun tone. It is a complete learning loop.

---

# 4. Conversation that teaches

## The learner controls the pace

- The complete cast remains visible around the conversation stage.
- The current speaker animates while their message appears progressively.
- Manual mode waits for **“I understand — next.”**
- Autoplay calculates reading time from message length.
- Prediction prompts ask learners what they think will happen next.
- At the end, the complete conversation becomes an ordered transcript.

## Doubts without losing context

- Ask a question during any message.
- Use character-specific suggested questions or type a custom doubt.
- The answer uses the lesson, character, factual reality checks, and sources as context.
- Questions and answers are saved beneath the exact message that caused them.

---

# 5. Accuracy with personality

## Entertainment serves the facts

- Gemini Google Search grounding retrieves current supporting material.
- Grounding metadata and citation URLs are retained with the lesson.
- Trusted sources appear as fact-check receipts.
- Reality checks translate the drama back into precise academic meaning.
- “Where the analogy stops” prevents metaphors from becoming misconceptions.
- Generated character references, diagram edges, and quiz structures are validated server-side.

**Speaker note:** This is our central design principle: humor is the delivery mechanism, not the source of truth.

---

# 6. Adaptive learning

## Every quiz changes what happens next

When **Auto difficulty** is selected, the system evaluates up to five recent quiz attempts.

| Recent performance | Adapted level |
| --- | --- |
| Below 55% | Beginner |
| 55–81% | Intermediate |
| 82% and above | Advanced |

The adaptation changes:

- Vocabulary and assumed background knowledge
- Depth of explanation
- Examples and edge cases
- Quiz challenge
- Recommended next episode

After each quiz, the learner can generate:

- **Fix my weak spots** — targeted misconception repair
- **Go deeper** — mechanisms, tradeoffs, and edge cases
- **Real-world episode** — an end-to-end practical scenario
- **Compare** — contrast with the nearest alternative

---

# 7. More than a chat response

## Multiple representations reinforce the same idea

- **Gossip stage:** relationships and causal explanations
- **Reality check:** precise facts and analogy boundaries
- **Concept map:** directional visual relationships
- **Quiz:** reasoning-focused assessment
- **Doubt history:** personalized clarification in context
- **Sources:** independent fact verification
- **Lesson history:** persistent episodes and learning paths

**Speaker note:** Different learners need different representations. The same concept becomes conversational, factual, visual, and testable.

---

# 8. Technology and architecture

```text
React + Vite frontend
        │
        │ JSON REST API
        ▼
Laravel 13 backend
   ├── Input validation
   ├── Prompt and grounding orchestration
   ├── Adaptive learning engine
   ├── Response quality checks
   └── Lesson, quiz, feedback and doubt APIs
        │
        ├──────────► Gemini + Google Search grounding
        │
        ▼
PostgreSQL 17
   ├── Lessons and parent follow-ups
   ├── Quiz attempts
   ├── Message-level doubts
   └── Learner feedback
```

## Engineering choices

- Frontend and backend are independently deployable.
- API credentials remain server-side.
- Docker Compose makes the development environment reproducible.
- Lessons use structured JSON rather than unvalidated free-form text.
- PostgreSQL stores durable learning history and episode relationships.

---

# 9. Live demo

## Recommended topic: “How your browser loads a website”

1. Select **Auto difficulty**, **Group chat**, drama level 4.
2. Introduce the cast: Browser, DNS, TCP, TLS, Server, and Cache.
3. Play two messages in autoplay.
4. Pause and ask DNS a doubt about translating domain names.
5. Show the reality check and improved directional concept map.
6. Finish the quiz with one intentional wrong answer.
7. Generate **Fix my weak spots**.
8. Show the grounded sources and linked follow-up in history.

**Backup topics:**

- TCP vs UDP during a live concert
- CRISPR enters the cell's group chat
- The French Revolution as a courtroom trial

---

# 10. What makes it different

| Typical AI learning chat | Spill the Tea |
| --- | --- |
| One long answer | Guided, paced conversation |
| Generic assistant voice | Functional concept-characters |
| Learner asks questions afterward | Doubts attached to exact messages |
| Same difficulty for everyone | Performance-based adaptation |
| Isolated answers | Connected follow-up episodes |
| Sources may be absent | Search grounding and fact-check receipts |
| Text-only explanation | Conversation, facts, map, quiz, and transcript |

**Core innovation:** narrative memory + factual grounding + adaptive assessment in one learning loop.

---

# 11. Impact and users

## Who benefits?

- Students revising difficult academic subjects
- Self-learners exploring technical concepts
- Teachers creating engaging lesson starters
- Developers learning systems and architecture
- Learners who struggle with dense textbook explanations

## Potential impact

- Higher engagement through story and character
- Better recall through distinctive voices and conflict
- Faster misconception detection through quizzes and doubts
- More learner agency through pacing and branching follow-ups
- Greater trust through citations and explicit analogy limits

---

# 12. Roadmap

## Next steps

- Voice acting and accessible subtitles for each character
- Teacher and classroom rooms with aggregate quiz insights
- Spaced-repetition reviews based on weak concepts
- Teach-back mode where the learner explains the topic to the cast
- Shareable public episodes and PDF/flashcard exports
- Multilingual stories with localized humor
- Analytics dashboard for progress, streaks, and mastery

**Speaker note:** The architecture already stores the data required for learning paths, doubts, performance, and follow-up episodes, so these are natural extensions rather than disconnected ideas.

---

# Spill the Tea

## Learning, but make it memorable.

**Closing line:** We are not replacing serious learning with gossip. We are using the structure of gossip—characters, conflict, curiosity, and consequences—to make serious learning finally stick.

**Demo:** `http://localhost:5173`

**API:** `http://localhost:8000/api`

