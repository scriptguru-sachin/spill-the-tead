import { useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Coffee,
  ExternalLink,
  History,
  LoaderCircle,
  Menu,
  MessageCircle,
  Network,
  Pause,
  Play,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";
const examples = [
  "How your browser loads a website",
  "TCP vs UDP during a live concert",
  "CRISPR enters the cell's group chat",
  "The French Revolution as a courtroom trial",
];
const tabs = [
  { id: "gossip", label: "The gossip", icon: MessageCircle },
  { id: "facts", label: "Reality check", icon: BookOpen },
  { id: "visual", label: "Concept map", icon: Network },
  { id: "quiz", label: "Quick quiz", icon: CircleHelp },
];

function getClientId() {
  let id = localStorage.getItem("spill-client-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("spill-client-id", id);
  }
  return id;
}

async function api(path, options) {
  const response = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    ...options,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      body.message ||
        body.error ||
        Object.values(body.errors || {})[0]?.[0] ||
        "The tea went cold. Try again.",
    );
  return body.data ?? body;
}

function StudyNode({ data }) {
  return (
    <div className={`study-node ${data.type}`}>
      <Handle type="target" position={Position.Left} />
      <div className="node-index">{data.index}</div>
      <div className="node-copy">
        <b>{data.label}</b>
        <span>{data.detail}</span>
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

function graphLayout(data) {
  const list = data?.nodes || [];
  const incoming = Object.fromEntries(list.map((node) => [node.id, 0]));
  const depth = Object.fromEntries(list.map((node) => [node.id, 0]));
  (data?.edges || []).forEach((edge) => {
    if (edge.source !== edge.target && edge.target in incoming)
      incoming[edge.target] += 1;
  });
  const queue = list
    .filter((node) => incoming[node.id] === 0)
    .map((node) => node.id);
  const visited = new Set();
  while (queue.length) {
    const id = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    (data?.edges || [])
      .filter((edge) => edge.source === id && edge.target !== id)
      .forEach((edge) => {
        depth[edge.target] = Math.max(
          depth[edge.target] || 0,
          (depth[id] || 0) + 1,
        );
        incoming[edge.target] -= 1;
        if (incoming[edge.target] <= 0) queue.push(edge.target);
      });
  }
  list.forEach((node, i) => {
    if (!visited.has(node.id)) depth[node.id] = i;
  });
  const rows = {};
  return list.map((node, i) => {
    const column = depth[node.id] || 0;
    const row = rows[column] || 0;
    rows[column] = row + 1;
    return {
      id: node.id,
      type: "study",
      position: { x: column * 285, y: row * 145 },
      data: { ...node, index: String(i + 1).padStart(2, "0") },
    };
  });
}

function ConceptMap({ data }) {
  const nodes = useMemo(() => graphLayout(data), [data]);
  const edges = useMemo(
    () =>
      (data?.edges || [])
        .filter((edge) => edge.source !== edge.target)
        .map((edge, i) => ({
          ...edge,
          id: edge.id || `e-${i}`,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed, color: "#9b6b4a" },
          labelBgPadding: [7, 4],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: "#f8f1e7", fillOpacity: 1 },
          labelStyle: { fill: "#655a4d", fontSize: 10, fontWeight: 600 },
          style: { stroke: "#9b6b4a", strokeWidth: 1.7 },
        })),
    [data],
  );
  return (
    <section className="map-card">
      <div className="section-title">
        <div>
          <span>VISUAL STUDY NOTES</span>
          <h3>{data?.title || "Concept map"}</h3>
        </div>
        <p>{data?.description}</p>
      </div>
      <div className="map-legend">
        <span>
          <i className="input" /> Starting point
        </span>
        <span>
          <i /> Core concept
        </span>
        <span>
          <i className="output" /> Outcome
        </span>
      </div>
      <div className="map-canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={{ study: StudyNode }}
          fitView
          fitViewOptions={{ padding: 0.22 }}
          minZoom={0.45}
          maxZoom={1.4}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
        >
          <Background color="#dfd4c3" gap={24} />
          <Controls showInteractive={false} />
        </ReactFlow>
      </div>
    </section>
  );
}

export default function App() {
  const clientId = useMemo(getClientId, []);
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("Auto");
  const [format, setFormat] = useState("Group chat");
  const [drama, setDrama] = useState(3);
  const [lesson, setLesson] = useState(null);
  const [history, setHistory] = useState([]);
  const [tab, setTab] = useState("gossip");
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebar, setSidebar] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [gossipIndex, setGossipIndex] = useState(0);
  const [visibleText, setVisibleText] = useState("");
  const [autoplay, setAutoplay] = useState(false);
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const speechUtterance = useRef(null);
  const [factIndex, setFactIndex] = useState(0);
  const [doubtCharacter, setDoubtCharacter] = useState(null);
  const [doubt, setDoubt] = useState("");
  const [doubtReply, setDoubtReply] = useState("");
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtHistory, setDoubtHistory] = useState([]);
  const [conversationComplete, setConversationComplete] = useState(false);
  const [followLoading, setFollowLoading] = useState("");

  const loadHistory = () =>
    api(`/lessons?client_id=${clientId}&limit=12`)
      .then(setHistory)
      .catch(() => {});
  useEffect(() => {
    loadHistory();
  }, []);
  useEffect(() => {
    setGossipIndex(0);
    setVisibleText("");
    setFactIndex(0);
    setAutoplay(false);
    setDoubtCharacter(null);
    setDoubtReply("");
    setConversationComplete(false);
  }, [lesson?.id]);
  useEffect(() => {
    if (!lesson || tab !== "gossip") return;
    const text = lesson.conversation[gossipIndex]?.text || "";
    setVisibleText("");
    let cursor = 0;
    const timer = setInterval(() => {
      cursor += 1;
      setVisibleText(text.slice(0, cursor));
      if (cursor >= text.length) clearInterval(timer);
    }, 34);
    return () => clearInterval(timer);
  }, [lesson?.id, gossipIndex, tab]);
  useEffect(() => {
    if (!autoplay || !lesson || tab !== "gossip") return;
    const text = lesson.conversation[gossipIndex]?.text || "";
    if (visibleText.length < text.length) return;
    const readingTime = Math.max(
      3600,
      Math.min(8000, text.split(/\s+/).length * 360),
    );
    const timer = setTimeout(() => {
      if (gossipIndex < lesson.conversation.length - 1)
        setGossipIndex((i) => i + 1);
      else {
        setAutoplay(false);
        setConversationComplete(true);
      }
    }, readingTime);
    return () => clearTimeout(timer);
  }, [autoplay, visibleText, gossipIndex, lesson, tab]);
  useEffect(() => {
    if (
      !autoplay ||
      !lesson ||
      tab !== "facts" ||
      factIndex >= lesson.realityCheck.length - 1
    )
      return;
    const timer = setTimeout(() => setFactIndex((i) => i + 1), 2600);
    return () => clearTimeout(timer);
  }, [autoplay, factIndex, lesson, tab]);
  useEffect(() => {
    if (!lesson?.id) return;
    api(`/lessons/${lesson.id}/doubts?client_id=${clientId}`)
      .then(setDoubtHistory)
      .catch(() => setDoubtHistory([]));
  }, [lesson?.id, clientId]);

  async function generate(chosen = topic) {
    if (!chosen.trim() || loading) return;
    setLoading(true);
    setError("");
    setLesson(null);
    setTab("gossip");
    setAnswers({});
    setResult(null);
    setFeedback(null);
    try {
      const data = await api("/lessons", {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          topic: chosen.trim(),
          level,
          format,
          drama,
        }),
      });
      setLesson(data);
      setTopic(chosen);
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openLesson(id) {
    try {
      setLoading(true);
      setLesson(await api(`/lessons/${id}`));
      setTab("gossip");
      setSidebar(false);
      setAnswers({});
      setResult(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function submitQuiz() {
    if (Object.keys(answers).length !== lesson.quiz.length) return;
    try {
      setResult(
        await api(`/lessons/${lesson.id}/quiz-attempts`, {
          method: "POST",
          body: JSON.stringify({
            client_id: clientId,
            answers: lesson.quiz.map((_, i) => answers[i]),
          }),
        }),
      );
    } catch (e) {
      setError(e.message);
    }
  }

  async function createFollowUp(mode) {
    if (followLoading) return;
    setFollowLoading(mode);
    setError("");
    try {
      const data = await api(`/lessons/${lesson.id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          mode,
          weak_concepts: result?.weakConcepts || [],
        }),
      });
      setLesson(data);
      setTab("gossip");
      setAnswers({});
      setResult(null);
      loadHistory();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setFollowLoading("");
    }
  }

  async function rate(helpful) {
    setFeedback(helpful);
    try {
      await api(`/lessons/${lesson.id}/feedback`, {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, helpful }),
      });
    } catch {
      setFeedback(null);
    }
  }

  async function askDoubt(
    question = doubt,
    character = doubtCharacter || currentSpeaker,
    message = currentMessage,
  ) {
    if (!character?.id || !question.trim() || doubtLoading) return;
    setDoubtCharacter(character);
    setDoubt(question);
    setDoubtLoading(true);
    setDoubtReply("");
    try {
      const data = await api(`/lessons/${lesson.id}/doubts`, {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          message_id: message?.id || null,
          character_id: character.id,
          question: question.trim(),
        }),
      });
      setDoubtReply(data.answer);
      setDoubtHistory((items) => [...items, data]);
    } catch (e) {
      setDoubtReply(e.message);
    } finally {
      setDoubtLoading(false);
    }
  }

  const cast = useMemo(
    () => Object.fromEntries((lesson?.characters || []).map((c) => [c.id, c])),
    [lesson],
  );

  const currentMessage = lesson?.conversation?.[gossipIndex];
  const currentSpeaker = currentMessage
    ? cast[currentMessage.characterId] || {}
    : {};
  const lastMessageReady =
    lesson &&
    gossipIndex === lesson.conversation.length - 1 &&
    visibleText.length === (currentMessage?.text || "").length;

  useEffect(() => {
    setSpeechPlaying(false);
    return () => {
      speechUtterance.current = null;
      if (typeof window !== "undefined" && "speechSynthesis" in window)
        window.speechSynthesis.cancel();
    };
  }, [lesson?.id, gossipIndex, tab]);

  function toggleMessageSpeech() {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window) ||
      !currentMessage?.text
    )
      return;
    if (speechPlaying) {
      speechUtterance.current = null;
      window.speechSynthesis.cancel();
      setSpeechPlaying(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(currentMessage.text);
    speechUtterance.current = utterance;
    utterance.onend = () => {
      if (speechUtterance.current === utterance) {
        speechUtterance.current = null;
        setSpeechPlaying(false);
      }
    };
    utterance.onerror = () => {
      if (speechUtterance.current === utterance) {
        speechUtterance.current = null;
        setSpeechPlaying(false);
      }
    };
    setSpeechPlaying(true);
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className={`app ${historyExpanded ? "" : "history-collapsed"}`}>
      <aside
        className={`sidebar ${sidebar ? "open" : ""} ${historyExpanded ? "" : "collapsed"}`}
      >
        <button className="sidebar-close" onClick={() => setSidebar(false)}>
          <X />
        </button>
        <a className="logo" href="#">
          <span>
            <Coffee />
          </span>
          <b>
            spill
            <br />
            the tea
          </b>
        </a>
        <button
          className="new-tea"
          onClick={() => {
            setLesson(null);
            setTopic("");
            setSidebar(false);
          }}
        >
          <Sparkles size={17} /> Brew new tea
        </button>
        <div className="history-label">
          <History size={14} /> YOUR RECENT TEA
        </div>
        <div className="history-list">
          {history.length ? (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => openLesson(item.id)}
                className={lesson?.id === item.id ? "active" : ""}
              >
                <span>{item.topic}</span>
                <small>
                  {item.level} · {item.format}
                </small>
                <ChevronRight size={15} />
              </button>
            ))
          ) : (
            <p>Your freshly brewed lessons will live here.</p>
          )}
        </div>
        <div className="sidebar-foot">
          <div>☕</div>
          <p>
            <b>Learning sticks</b>
            <br />
            when the story does.
          </p>
        </div>
      </aside>
      {sidebar && (
        <button
          className="scrim"
          onClick={() => setSidebar(false)}
          aria-label="Close menu"
        />
      )}

      <main>
        <header>
          <button className="menu" onClick={() => setSidebar(true)}>
            <Menu />
          </button>
          <div className="mobile-logo">
            <Coffee /> Spill the Tea
          </div>
          <div className="header-note">
            <span></span> AI learning studio
          </div>
          <button
            className="history-button"
            onClick={() => {
              if (window.innerWidth <= 900) setSidebar(true);
              else setHistoryExpanded((value) => !value);
            }}
          >
            <History size={16} />
            {historyExpanded ? "Hide history" : "History"}
          </button>
        </header>

        {!lesson && !loading && (
          <div className="landing">
            <section className="hero-copy">
              <div className="kicker">
                <span>THE LESSON HAS ENTERED THE CHAT</span>
              </div>
              <h1>
                Learn anything.
                <br />
                <em>Hear all about it.</em>
              </h1>
              <p>
                Complex ideas become unforgettable conversations—with sharp
                characters, factual receipts, and just enough drama.
              </p>
            </section>
            <section className="brew-card">
              <div className="brew-top">
                <span>01</span>
                <div>
                  <b>What are we talking about?</b>
                  <small>
                    Any idea, event, system, or “wait, how does that work?”
                  </small>
                </div>
              </div>
              <div className="topic-box">
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      generate();
                    }
                  }}
                  placeholder="e.g. Why does Redis make apps faster?"
                  maxLength={300}
                />
                <button
                  onClick={() => generate()}
                  disabled={loading || !topic.trim()}
                >
                  <ArrowUpRight />
                </button>
              </div>
              <div className="controls-row">
                <label>
                  <span>YOUR LEVEL</span>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    <option value="Auto">Auto · adapt to me</option>
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </label>
                <label>
                  <span>STORY STYLE</span>
                  <select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option>Group chat</option>
                    <option>Courtroom debate</option>
                    <option>Reality show</option>
                    <option>Interview</option>
                  </select>
                </label>
                <label className="drama">
                  <span>
                    DRAMA LEVEL <b>{drama}/5</b>
                  </span>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={drama}
                    onChange={(e) => setDrama(+e.target.value)}
                  />
                  <small>
                    {drama < 3 ? "Chill" : drama < 5 ? "Messy" : "Unhinged"}
                  </small>
                </label>
              </div>
              <button
                className="brew-button"
                onClick={() => generate()}
                disabled={loading || !topic.trim()}
              >
                <Coffee /> Spill the tea <ArrowUpRight />
              </button>
              {error && <div className="error">Plot twist: {error}</div>}
            </section>
            <div className="prompt-row">
              <span>NEED A TOPIC?</span>
              {examples.map((x) => (
                <button
                  key={x}
                  onClick={() => {
                    setTopic(x);
                    generate(x);
                  }}
                >
                  {x}
                  <ArrowUpRight size={13} />
                </button>
              ))}
            </div>
            <section className="how">
              <div>
                <span>01</span>
                <b>Pick a topic</b>
                <p>From cell biology to world history.</p>
              </div>
              <div>
                <span>02</span>
                <b>Meet the cast</b>
                <p>Every concept gets a memorable role.</p>
              </div>
              <div>
                <span>03</span>
                <b>Get the receipts</b>
                <p>Facts, concept maps, and a quick quiz.</p>
              </div>
            </section>
          </div>
        )}

        {loading && !lesson && (
          <div className="brewing">
            <div className="cup">☕</div>
            <h2>Gathering the group chat…</h2>
            <p>
              Researching the facts, casting the concepts, and adding a tasteful
              amount of chaos.
            </p>
            <div className="brew-progress">
              <i />
            </div>
          </div>
        )}

        {lesson && (
          <article className="lesson">
            <div className="lesson-head">
              <div>
                <span className="episode-label">
                  {lesson.parentLessonId ? "FOLLOW-UP EPISODE" : "NEW EPISODE"}{" "}
                  · {lesson.level}
                </span>
                <h1>{lesson.episodeTitle}</h1>
                <p>{lesson.topicSummary}</p>
                <div className="lesson-meta">
                  <span>{lesson.format}</span>
                  <span>Drama {lesson.drama}/5</span>
                  <span>{lesson.quiz?.length || 0} quiz questions</span>
                  {lesson.grounding?.enabled && (
                    <span className="grounded">
                      <Check /> Search grounded · {lesson.grounding.sourceCount}{" "}
                      sources
                    </span>
                  )}
                </div>
                {lesson.adaptiveProfile && (
                  <div className="adaptive-note">
                    <Sparkles />
                    <div>
                      <b>
                        Difficulty adapted to {lesson.adaptiveProfile.level}
                      </b>
                      <span>{lesson.adaptiveProfile.reason}</span>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setLesson(null)}>
                <Sparkles /> New topic
              </button>
            </div>
            <section className="cast">
              <div className="section-title">
                <div>
                  <span>MEET THE CAST</span>
                  <h3>The concepts in this story</h3>
                </div>
                <p>Real terminology. Very opinionated personalities.</p>
              </div>
              <div className="cast-grid">
                {lesson.characters.map((c, i) => (
                  <div className="cast-card" key={c.id}>
                    <span className="cast-no">0{i + 1}</span>
                    <div className="avatar">{c.avatar}</div>
                    <h4>{c.name}</h4>
                    <b>{c.role}</b>
                    <p>{c.personality}</p>
                    <blockquote>“{c.intro}”</blockquote>
                  </div>
                ))}
              </div>
            </section>
            <nav className="tabs">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={tab === id ? "active" : ""}
                  onClick={() => setTab(id)}
                >
                  <Icon size={17} />
                  {label}
                </button>
              ))}
            </nav>

            {tab === "gossip" && (
              <section className="chat story-chat">
                <div className="chat-bar">
                  <div>
                    <span></span>
                    <b>{lesson.topic}</b>
                  </div>
                  <div className="playback">
                    <small>
                      {gossipIndex + 1} / {lesson.conversation.length}
                    </small>
                    <button
                      className={autoplay ? "on" : ""}
                      onClick={() => setAutoplay((x) => !x)}
                    >
                      {autoplay ? <Pause /> : <Play />} Autoplay
                    </button>
                  </div>
                </div>
                {!conversationComplete ? (
                  <>
                    <div className="conversation-arena">
                      <div className="cast-side left">
                        {lesson.characters
                          .filter((_, i) => i % 2 === 0)
                          .map((c) => (
                            <div
                              className={`arena-character ${currentSpeaker.id === c.id ? "speaking" : ""}`}
                              key={c.id}
                            >
                              <div>{c.avatar}</div>
                              <span>{c.name}</span>
                              {currentSpeaker.id === c.id && (
                                <small>speaking</small>
                              )}
                            </div>
                          ))}
                      </div>
                      <div className="center-stage">
                        <div
                          className={`message active-message ${currentMessage?.kind || ""}`}
                          key={currentMessage?.id}
                        >
                          <div>
                            <div className="speaker">
                              <b>{currentSpeaker.name || "Narrator"}</b>
                              <span>{currentSpeaker.role}</span>
                              <small>
                                {String(gossipIndex + 1).padStart(2, "0")}
                              </small>
                              <button
                                className="speak-message"
                                onClick={toggleMessageSpeech}
                                disabled={
                                  !currentMessage?.text ||
                                  (typeof window !== "undefined" &&
                                    !("speechSynthesis" in window))
                                }
                                aria-label={
                                  speechPlaying
                                    ? "Stop reading message aloud"
                                    : "Read message aloud"
                                }
                                aria-pressed={speechPlaying}
                                title={
                                  typeof window !== "undefined" &&
                                  !("speechSynthesis" in window)
                                    ? "Text-to-speech is not supported in this browser"
                                    : undefined
                                }
                              >
                                {speechPlaying ? <Square /> : <Volume2 />}
                                {speechPlaying ? "Stop" : "Listen"}
                              </button>
                            </div>
                            <p>
                              {visibleText}
                              <i className="typing-caret" />
                            </p>
                            {currentMessage?.reflectionPrompt &&
                              visibleText.length ===
                                currentMessage.text.length && (
                                <div className="reflection-cue">
                                  <b>Your turn to predict</b>
                                  {currentMessage.reflectionPrompt}
                                </div>
                              )}
                          </div>
                        </div>
                        <button
                          className="inline-doubt-trigger"
                          onClick={() => {
                            setDoubtCharacter(currentSpeaker);
                            setDoubt("");
                            setDoubtReply("");
                          }}
                        >
                          <CircleHelp /> Ask a doubt about this message
                        </button>
                        {doubtCharacter?.id === currentSpeaker.id && (
                          <div className="inline-doubt">
                            <div className="quick-doubts">
                              {(
                                currentSpeaker.quickDoubts || [
                                  "Can you explain that more simply?",
                                  "Why does that happen?",
                                ]
                              ).map((q) => (
                                <button
                                  onClick={() =>
                                    askDoubt(q, currentSpeaker, currentMessage)
                                  }
                                  key={q}
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                            <div className="doubt-input">
                              <input
                                value={doubt}
                                onChange={(e) => setDoubt(e.target.value)}
                                onKeyDown={(e) =>
                                  e.key === "Enter" &&
                                  askDoubt(
                                    doubt,
                                    currentSpeaker,
                                    currentMessage,
                                  )
                                }
                                placeholder={`Ask ${currentSpeaker.name} about this message…`}
                              />
                              <button
                                disabled={!doubt.trim() || doubtLoading}
                                onClick={() =>
                                  askDoubt(
                                    doubt,
                                    currentSpeaker,
                                    currentMessage,
                                  )
                                }
                              >
                                {doubtLoading ? (
                                  <LoaderCircle className="spin" />
                                ) : (
                                  <Send />
                                )}
                              </button>
                            </div>
                            {(doubtReply || doubtLoading) && (
                              <div className="doubt-answer">
                                <span
                                  className={doubtLoading ? "speaking" : ""}
                                >
                                  {currentSpeaker.avatar}
                                </span>
                                <div>
                                  <b>{currentSpeaker.name}</b>
                                  <p>
                                    {doubtLoading
                                      ? "Thinking through the facts…"
                                      : doubtReply}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="cast-side right">
                        {lesson.characters
                          .filter((_, i) => i % 2 === 1)
                          .map((c) => (
                            <div
                              className={`arena-character ${currentSpeaker.id === c.id ? "speaking" : ""}`}
                              key={c.id}
                            >
                              <div>{c.avatar}</div>
                              <span>{c.name}</span>
                              {currentSpeaker.id === c.id && (
                                <small>speaking</small>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                    <div className="story-controls">
                      <button
                        disabled={gossipIndex === 0}
                        onClick={() => {
                          setGossipIndex((i) => i - 1);
                          setDoubtCharacter(null);
                        }}
                      >
                        Previous
                      </button>
                      <div>
                        {lesson.conversation.map((_, i) => (
                          <i
                            key={i}
                            className={i <= gossipIndex ? "seen" : ""}
                          />
                        ))}
                      </div>
                      <button
                        className="next-line"
                        onClick={() => {
                          const full = currentMessage?.text || "";
                          if (visibleText.length < full.length)
                            setVisibleText(full);
                          else if (lastMessageReady)
                            setConversationComplete(true);
                          else {
                            setGossipIndex((i) => i + 1);
                            setDoubtCharacter(null);
                            setDoubtReply("");
                          }
                        }}
                      >
                        {visibleText.length <
                        (currentMessage?.text || "").length
                          ? "Show full message"
                          : lastMessageReady
                            ? "Finish & review"
                            : "I understand — next"}{" "}
                        <ArrowRight />
                      </button>
                    </div>
                  </>
                ) : (
                  <section className="conversation-history">
                    <div className="history-complete">
                      <Check />
                      <div>
                        <span>CONVERSATION COMPLETE</span>
                        <h3>Your full tea transcript</h3>
                        <p>
                          Review every idea in sequence, including the doubts
                          you asked along the way.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setGossipIndex(0);
                          setDoubtCharacter(null);
                          setConversationComplete(false);
                        }}
                      >
                        <RotateCcw /> Replay
                      </button>
                    </div>
                    {lesson.conversation.map((m, i) => {
                      const c = cast[m.characterId] || {};
                      const messageDoubts = doubtHistory.filter(
                        (item) => item.message_id === m.id,
                      );
                      return (
                        <div className="transcript-item" key={m.id || i}>
                          <div className="transcript-line">
                            <span>{c.avatar}</span>
                            <div>
                              <small>
                                {String(i + 1).padStart(2, "0")} · {c.name}
                              </small>
                              <p>{m.text}</p>
                            </div>
                          </div>
                          {messageDoubts.map((item) => (
                            <div className="saved-doubt" key={item.id}>
                              <CircleHelp />
                              <div>
                                <b>You asked: {item.question}</b>
                                <p>{item.answer}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </section>
                )}
                {conversationComplete && (
                  <div className="after-story">
                    <section className="sources">
                      <div>
                        <span>FACT-CHECK RECEIPTS</span>
                        <h3>Trusted sources behind the story</h3>
                      </div>
                      <div className="source-grid">
                        {(lesson.sources || []).map((source, i) => (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            key={i}
                          >
                            <small>{source.publisher}</small>
                            <b>{source.title}</b>
                            <p>{source.supports}</p>
                            <ExternalLink />
                          </a>
                        ))}
                      </div>
                    </section>
                    <section className="doubts">
                      <div className="doubt-heading">
                        <span>ASK THE CAST</span>
                        <h3>Still have a doubt? Take it to the source.</h3>
                        <p>Pick a character and ask in plain language.</p>
                      </div>
                      <div className="doubt-avatars">
                        {lesson.characters.map((c) => (
                          <button
                            className={
                              doubtCharacter?.id === c.id ? "selected" : ""
                            }
                            onClick={() => {
                              setDoubtCharacter(c);
                              setDoubt("");
                              setDoubtReply("");
                            }}
                            key={c.id}
                          >
                            <span>{c.avatar}</span>
                            <b>{c.name}</b>
                          </button>
                        ))}
                      </div>
                      {doubtCharacter && (
                        <div className="doubt-box">
                          <div className="doubt-person">
                            <span>{doubtCharacter.avatar}</span>
                            <div>
                              <small>ASKING</small>
                              <b>{doubtCharacter.name}</b>
                            </div>
                          </div>
                          <div className="quick-doubts">
                            {(
                              doubtCharacter.quickDoubts || [
                                `What do you actually do?`,
                                `Why are you important here?`,
                              ]
                            ).map((q) => (
                              <button
                                onClick={() =>
                                  askDoubt(q, doubtCharacter, null)
                                }
                                key={q}
                              >
                                {q}
                              </button>
                            ))}
                          </div>
                          <div className="doubt-input">
                            <input
                              value={doubt}
                              onChange={(e) => setDoubt(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" &&
                                askDoubt(doubt, doubtCharacter, null)
                              }
                              placeholder={`Ask ${doubtCharacter.name} your doubt…`}
                            />
                            <button
                              disabled={!doubt.trim() || doubtLoading}
                              onClick={() =>
                                askDoubt(doubt, doubtCharacter, null)
                              }
                            >
                              {doubtLoading ? (
                                <LoaderCircle className="spin" />
                              ) : (
                                <Send />
                              )}
                            </button>
                          </div>
                          {(doubtReply || doubtLoading) && (
                            <div className="doubt-answer">
                              <span className={doubtLoading ? "speaking" : ""}>
                                {doubtCharacter.avatar}
                              </span>
                              <div>
                                <b>{doubtCharacter.name}</b>
                                <p>
                                  {doubtLoading
                                    ? "Thinking through the facts…"
                                    : doubtReply}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                    <div className="feedback">
                      <span>Did this make the topic click?</span>
                      <button
                        className={feedback === true ? "selected" : ""}
                        onClick={() => rate(true)}
                      >
                        <ThumbsUp /> Yes
                      </button>
                      <button
                        className={feedback === false ? "selected" : ""}
                        onClick={() => rate(false)}
                      >
                        <ThumbsDown /> Not yet
                      </button>
                    </div>
                  </div>
                )}
              </section>
            )}
            {tab === "facts" && (
              <section className="facts paced-facts">
                <div className="section-title">
                  <div>
                    <span>THE FACTUAL RECEIPTS</span>
                    <h3>What it actually means</h3>
                  </div>
                  <button
                    className={autoplay ? "fact-auto on" : "fact-auto"}
                    onClick={() => setAutoplay((x) => !x)}
                  >
                    {autoplay ? <Pause /> : <Play />} Autoplay
                  </button>
                </div>
                <div className="fact-progress">
                  {lesson.realityCheck.map((_, i) => (
                    <button
                      className={i <= factIndex ? "seen" : ""}
                      onClick={() => setFactIndex(i)}
                      key={i}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </button>
                  ))}
                </div>
                {lesson.realityCheck.slice(0, factIndex + 1).map((x, i) => (
                  <div
                    className={`fact revealed ${i === factIndex ? "current" : ""}`}
                    key={i}
                  >
                    <span>0{i + 1}</span>
                    <div>
                      <h4>{x.concept}</h4>
                      <p>{x.actualMeaning}</p>
                      {x.analogyLimit && (
                        <aside>
                          <b>Where the analogy stops</b>
                          {x.analogyLimit}
                        </aside>
                      )}
                    </div>
                  </div>
                ))}
                {factIndex < lesson.realityCheck.length - 1 && (
                  <button
                    className="next-fact"
                    onClick={() => setFactIndex((i) => i + 1)}
                  >
                    Reveal next fact <ArrowRight />
                  </button>
                )}
              </section>
            )}
            {tab === "visual" && <ConceptMap data={lesson.visualization} />}
            {tab === "quiz" && (
              <section className="quiz">
                <div className="section-title">
                  <div>
                    <span>POP QUIZ</span>
                    <h3>So, were you listening?</h3>
                  </div>
                  {result && (
                    <strong className="score">
                      {result.score}/{result.total} correct
                    </strong>
                  )}
                </div>
                {lesson.quiz.map((q, qi) => (
                  <div className="question" key={qi}>
                    <span>
                      QUESTION {String(qi + 1).padStart(2, "0")}
                      {q.concept && ` · ${q.concept}`}
                    </span>
                    <h4>{q.question}</h4>
                    <div className="options">
                      {q.options.map((o, oi) => {
                        const revealed = !!result;
                        return (
                          <button
                            disabled={revealed}
                            className={`${answers[qi] === oi ? "chosen" : ""} ${revealed && q.correctIndex === oi ? "correct" : ""} ${revealed && answers[qi] === oi && q.correctIndex !== oi ? "wrong" : ""}`}
                            onClick={() =>
                              setAnswers((a) => ({ ...a, [qi]: oi }))
                            }
                            key={oi}
                          >
                            <i>{String.fromCharCode(65 + oi)}</i>
                            {o}
                            {revealed && q.correctIndex === oi && <Check />}
                          </button>
                        );
                      })}
                    </div>
                    {result && <p className="explanation">{q.explanation}</p>}
                  </div>
                ))}
                {!result && (
                  <button
                    className="submit-quiz"
                    disabled={
                      Object.keys(answers).length !== lesson.quiz.length
                    }
                    onClick={submitQuiz}
                  >
                    Check my answers <ArrowUpRight />
                  </button>
                )}
                {result && (
                  <section className="learning-path">
                    <div className="path-result">
                      <Sparkles />
                      <div>
                        <span>YOUR ADAPTIVE NEXT STEP</span>
                        <h3>
                          {result.weakConcepts?.length
                            ? `Let’s clear up ${result.weakConcepts.join(" and ")}`
                            : "You’re ready to go deeper"}
                        </h3>
                        <p>
                          Your next episode will use{" "}
                          {result.recommendedLevel.toLowerCase()} pacing based
                          on this result.
                        </p>
                      </div>
                    </div>
                    <div className="path-options">
                      <button
                        className={
                          result.nextBestAction === "weak_spots"
                            ? "recommended"
                            : ""
                        }
                        disabled={followLoading}
                        onClick={() => createFollowUp("weak_spots")}
                      >
                        <b>Fix my weak spots</b>
                        <span>Fresh examples for missed concepts</span>
                        {result.nextBestAction === "weak_spots" && (
                          <i>RECOMMENDED</i>
                        )}
                      </button>
                      <button
                        className={
                          result.nextBestAction === "go_deeper"
                            ? "recommended"
                            : ""
                        }
                        disabled={followLoading}
                        onClick={() => createFollowUp("go_deeper")}
                      >
                        <b>Go deeper</b>
                        <span>Mechanisms, tradeoffs, and edge cases</span>
                        {result.nextBestAction === "go_deeper" && (
                          <i>RECOMMENDED</i>
                        )}
                      </button>
                      <button
                        disabled={followLoading}
                        onClick={() => createFollowUp("practical")}
                      >
                        <b>See it in the real world</b>
                        <span>One end-to-end practical scenario</span>
                      </button>
                    </div>
                    {followLoading && (
                      <div className="follow-loading">
                        <LoaderCircle className="spin" /> Brewing your adaptive
                        follow-up episode…
                      </div>
                    )}
                  </section>
                )}
              </section>
            )}
          </article>
        )}
        <footer>
          <Coffee /> Spill the Tea <span>Learning, but make it memorable.</span>
        </footer>
      </main>
    </div>
  );
}
