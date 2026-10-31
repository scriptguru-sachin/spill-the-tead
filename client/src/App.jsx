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
  FileText,
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
  ThumbsDown,
  ThumbsUp,
  Volume2,
  X,
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";
const topicAudiences = [
  { id: "all", label: "All ages" },
  { id: "6-9", label: "Ages 6–9" },
  { id: "10-12", label: "Ages 10–12" },
  { id: "13-17", label: "Ages 13–17" },
  { id: "18+", label: "Adults 18+" },
];
const topicCategories = [
  {
    name: "Money & finance",
    topics: {
      all: ["How do budgets and savings work?", "What makes prices go up or down?"],
      "6-9": ["Saving pocket money for something special", "Why do things have different prices?"],
      "10-12": ["How a budget helps you reach a savings goal", "What supply and demand have to do with prices"],
      "13-17": ["How bank accounts, interest, and credit work", "How to make a first monthly budget"],
      "18+": ["How compound interest builds wealth over time", "Investing basics: risk, return, and diversification"],
    },
  },
  {
    name: "Biology & life",
    topics: {
      all: ["How your immune system protects you", "Why do plants need sunlight?"],
      "6-9": ["How your body turns food into energy", "How a tiny seed grows into a plant"],
      "10-12": ["How the brain sends messages around your body", "How food chains connect living things"],
      "13-17": ["How DNA instructions make proteins", "How evolution changes populations over time"],
      "18+": ["How the immune system recognizes a new pathogen", "How genes, environment, and cells shape health"],
    },
  },
  {
    name: "DSA & problem-solving",
    topics: {
      all: ["How does a search algorithm find a name?", "How can you organize a big pile of information?"],
      "6-9": ["How to sort a collection of cards step by step", "How a treasure map can work like a search algorithm"],
      "10-12": ["How lists and dictionaries organize information", "How to find a route through a maze efficiently"],
      "13-17": ["How arrays, stacks, and queues solve different problems", "How binary search quickly finds an item"],
      "18+": ["How hash maps and trees make lookups efficient", "How to compare sorting algorithms and their trade-offs"],
    },
  },
  {
    name: "Technology",
    topics: {
      all: ["How does the internet send a message?", "How does artificial intelligence learn patterns?"],
      "6-9": ["How a video travels from the internet to your screen", "How a robot follows instructions"],
      "10-12": ["How websites talk to servers", "How AI spots patterns in pictures"],
      "13-17": ["How APIs let apps communicate", "How machine-learning models learn from data"],
      "18+": ["How cloud computing scales an online service", "How encryption protects data on the internet"],
    },
  },
  {
    name: "Everyday & beyond",
    topics: {
      all: ["Why do people vote?", "How do you spot a convincing argument?"],
      "6-9": ["How a community makes fair rules", "Why do we have different kinds of weather?"],
      "10-12": ["How local government makes decisions", "How to tell a reliable fact from a rumor"],
      "13-17": ["How an election turns votes into decisions", "How to recognize bias in online information"],
      "18+": ["How public policy shapes everyday life", "How to evaluate arguments and evidence critically"],
    },
  },
];
const tabs = [
  { id: "gossip", label: "The gossip", icon: MessageCircle },
  { id: "technical", label: "Technical explanation", icon: FileText },
  { id: "facts", label: "Reality check", icon: BookOpen },
  { id: "visual", label: "Concept map", icon: Network },
  { id: "quiz", label: "Quick quiz", icon: CircleHelp },
];
const messageFollowUps = [
  {
    id: "plain_language",
    label: "Explain more simply",
    instruction: "Explain this message in plain, simple language without changing its meaning.",
  },
  {
    id: "real_world_example",
    label: "Give me an example",
    instruction: "Give one concrete, relevant real-world example that illustrates this message.",
  },
  {
    id: "why_it_matters",
    label: "Why does it matter?",
    instruction: "Explain why this idea matters and what it affects in the larger topic.",
  },
  {
    id: "connect_the_dots",
    label: "Connect it to another idea",
    instruction: "Explain how this idea connects to another key idea in the lesson.",
  },
];

function getTeachBackResponse(question) {
  if (typeof question !== "string" || !question.startsWith("TEACH_BACK:"))
    return null;
  const end = question.indexOf("\n");
  if (end < 0) return null;
  try {
    const submission = JSON.parse(question.slice("TEACH_BACK:".length, end));
    return typeof submission.response === "string" ? submission.response : null;
  } catch {
    return null;
  }
}

function getMessageFollowUpMode(question) {
  if (typeof question !== "string" || !question.startsWith("FOLLOW_UP:"))
    return null;
  const mode = question.slice("FOLLOW_UP:".length).split("\n", 1)[0];
  return messageFollowUps.find((followUp) => followUp.id === mode) || null;
}

function getClientId() {
  let id = localStorage.getItem("spill-client-id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("spill-client-id", id);
  }
  return id;
}

function TeachBackReport({ report }) {
  return (
    <div className="teach-back-report">
      {report.strengths?.length > 0 && (
        <div>
          <b>What you explained well</b>
          <ul>
            {report.strengths.map((item, index) => (
              <li key={`strength-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {report.gaps?.length > 0 && (
        <div>
          <b>What to strengthen</b>
          <ul>
            {report.gaps.map((item, index) => (
              <li key={`gap-${index}`}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      {report.correction && (
        <p>
          <b>Clarification:</b> {report.correction}
        </p>
      )}
      {report.next_step && (
        <p>
          <b>Try next:</b> {report.next_step}
        </p>
      )}
    </div>
  );
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
  const [topicAudience, setTopicAudience] = useState("all");
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
  const [typedMessageKey, setTypedMessageKey] = useState(null);
  const typingTimerRef = useRef(null);
  const [autoplay, setAutoplay] = useState(false);
  const [autoplayPaused, setAutoplayPaused] = useState(false);
  const [autoplayCountdown, setAutoplayCountdown] = useState(null);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const speechUtterance = useRef(null);
  const speechUtteranceKey = useRef(null);
  const autoplayAdvancePending = useRef(null);
  const autoplayPausedRef = useRef(autoplayPaused);
  const autoplayTimerRef = useRef(null);
  const autoplayRef = useRef(autoplay);
  const lessonRef = useRef(lesson);
  const gossipIndexRef = useRef(gossipIndex);
  const currentSpeechMessageKeyRef = useRef(null);
  const speechEnabledRef = useRef(speechEnabled);
  const [factIndex, setFactIndex] = useState(0);
  const [doubtCharacter, setDoubtCharacter] = useState(null);
  const [doubt, setDoubt] = useState("");
  const [doubtReply, setDoubtReply] = useState("");
  const [doubtLoading, setDoubtLoading] = useState(false);
  const [doubtHistory, setDoubtHistory] = useState([]);
  const [openFollowUpKey, setOpenFollowUpKey] = useState("");
  const [followUpLoadingKey, setFollowUpLoadingKey] = useState("");
  const [followUpError, setFollowUpError] = useState("");
  const [followUpErrorKey, setFollowUpErrorKey] = useState("");
  const [predictionDraft, setPredictionDraft] = useState("");
  const [predictionFeedback, setPredictionFeedback] = useState("");
  const [predictionError, setPredictionError] = useState("");
  const [predictionLoading, setPredictionLoading] = useState(false);
  const predictionRequest = useRef(0);
  const [teachBackDraft, setTeachBackDraft] = useState("");
  const [teachBackReply, setTeachBackReply] = useState("");
  const [teachBackReport, setTeachBackReport] = useState(null);
  const [teachBackAttempts, setTeachBackAttempts] = useState([]);
  const [teachBackHistoryError, setTeachBackHistoryError] = useState("");
  const [teachBackError, setTeachBackError] = useState("");
  const [teachBackLoading, setTeachBackLoading] = useState(false);
  const teachBackRequest = useRef(0);
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
    setAutoplayPaused(false);
    setAutoplayCountdown(null);
    autoplayTimerRef.current = null;
    setDoubtCharacter(null);
    setDoubtReply("");
    setOpenFollowUpKey("");
    setFollowUpLoadingKey("");
    setFollowUpError("");
    setFollowUpErrorKey("");
    teachBackRequest.current += 1;
    setTeachBackDraft("");
    setTeachBackReply("");
    setTeachBackReport(null);
    setTeachBackAttempts([]);
    setTeachBackHistoryError("");
    setTeachBackError("");
    setTeachBackLoading(false);
    setConversationComplete(false);
  }, [lesson?.id]);
  useEffect(() => {
    if (!lesson || tab !== "gossip") return;
    const message = lesson.conversation[gossipIndex];
    const text = message?.text || "";
    const messageKey = message?.id ?? `${lesson.id}:${gossipIndex}`;
    if (typingTimerRef.current) clearInterval(typingTimerRef.current);
    setVisibleText("");
    setTypedMessageKey(null);
    if (!text) {
      setTypedMessageKey(messageKey);
      return;
    }
    let cursor = 0;
    const timer = setInterval(() => {
      cursor += 1;
      setVisibleText(text.slice(0, cursor));
      if (cursor >= text.length) {
        clearInterval(timer);
        typingTimerRef.current = null;
        setTypedMessageKey(messageKey);
      }
    }, 34);
    typingTimerRef.current = timer;
    return () => {
      clearInterval(timer);
      if (typingTimerRef.current === timer) typingTimerRef.current = null;
    };
  }, [lesson?.id, gossipIndex, tab]);
  function advanceAutoplay(messageKey) {
    const currentLesson = lessonRef.current;
    const currentIndex = gossipIndexRef.current;
    if (
      !autoplayRef.current ||
      autoplayPausedRef.current ||
      currentSpeechMessageKeyRef.current !== messageKey ||
      !currentLesson?.conversation?.length
    )
      return;
    setAutoplayCountdown(null);
    autoplayTimerRef.current = null;
    if (currentIndex < currentLesson.conversation.length - 1) {
      setGossipIndex((index) => index + 1);
      setDoubtCharacter(null);
      setDoubtReply("");
    } else {
      setAutoplay(false);
      setConversationComplete(true);
    }
  }

  useEffect(() => {
    if (!autoplay || !lesson || tab !== "gossip") return;
    const message = lesson.conversation[gossipIndex];
    const text = message?.text || "";
    const messageKey = message?.id ?? `${lesson.id}:${gossipIndex}`;
    if (
      visibleText.length < text.length ||
      typedMessageKey !== messageKey
    )
      return;
    const displayDuration = Math.max(
      3600,
      Math.min(8000, text.split(/\s+/).length * 360),
    );
    let timerState = autoplayTimerRef.current;
    if (!timerState || timerState.messageKey !== messageKey) {
      timerState = { messageKey, duration: displayDuration, elapsed: 0 };
      autoplayTimerRef.current = timerState;
    }
    if (autoplayPaused) return;
    const startedAt = Date.now();
    const elapsedBeforeStart = timerState.elapsed;
    setAutoplayCountdown({
      messageKey,
      progress: elapsedBeforeStart / displayDuration,
    });
    const timer = setInterval(() => {
      const elapsed = Math.min(
        elapsedBeforeStart + Date.now() - startedAt,
        displayDuration,
      );
      timerState.elapsed = elapsed;
      const progress = Math.min(elapsed / displayDuration, 1);
      if (progress < 1) {
        setAutoplayCountdown({
          messageKey,
          progress,
        });
        return;
      }

      clearInterval(timer);
      if (
        speechEnabledRef.current &&
        speechUtterance.current &&
        speechUtteranceKey.current === messageKey
      ) {
        autoplayAdvancePending.current = messageKey;
        setAutoplayCountdown({
          messageKey,
          progress: 1,
        });
        return;
      }
      setAutoplayCountdown(null);
      advanceAutoplay(messageKey);
    }, 100);
    return () => {
      clearInterval(timer);
      if (autoplayTimerRef.current === timerState) {
        timerState.elapsed = Math.min(
          elapsedBeforeStart + Date.now() - startedAt,
          displayDuration,
        );
      }
    };
  }, [
    autoplay,
    autoplayPaused,
    visibleText,
    typedMessageKey,
    gossipIndex,
    lesson,
    tab,
  ]);
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
    setTeachBackAttempts([]);
    setTeachBackHistoryError("");
    api(`/lessons/${lesson.id}/teach-back-attempts?client_id=${clientId}`)
      .then(setTeachBackAttempts)
      .catch((e) => setTeachBackHistoryError(e.message));
  }, [lesson?.id, clientId]);

  async function generate(chosen = topic) {
    if (!chosen.trim() || loading) return;
    cancelSpeech();
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

  async function generateDeeperLesson(parentLesson) {
    if (!parentLesson?.id || loading) return;
    cancelSpeech();
    setLoading(true);
    setError("");
    setLesson(null);
    setTab("gossip");
    setAnswers({});
    setResult(null);
    setFeedback(null);
    try {
      const data = await api(`/lessons/${parentLesson.id}/follow-ups`, {
        method: "POST",
        body: JSON.stringify({ client_id: clientId, mode: "go_deeper" }),
      });
      setLesson(data);
      setTopic(data.topic);
      loadHistory();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function openLesson(id) {
    cancelSpeech();
    try {
      setLoading(true);
      const data = await api(`/lessons/${id}`);
      setLesson(data);
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
    cancelSpeech();
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

  async function askMessageFollowUp(mode, message, character, messageKey) {
    if (
      !message?.id ||
      !character?.id ||
      followUpLoadingKey ||
      !lesson?.id
    )
      return;
    const option = messageFollowUps.find((followUp) => followUp.id === mode);
    if (!option) return;

    setOpenFollowUpKey(messageKey);
    setFollowUpLoadingKey(`${messageKey}:${mode}`);
    setFollowUpError("");
    setFollowUpErrorKey("");
    try {
      const data = await api(`/lessons/${lesson.id}/doubts`, {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          message_id: message.id,
          character_id: character.id,
          question: `FOLLOW_UP:${option.id}\n${option.instruction}`,
        }),
      });
      if (typeof data.answer !== "string" || !data.answer.trim())
        throw new Error("That follow-up wasn't available. Please try again.");
      setDoubtHistory((items) => [...items, data]);
    } catch (e) {
      setFollowUpError(e.message);
      setFollowUpErrorKey(messageKey);
    } finally {
      setFollowUpLoadingKey("");
    }
  }

  async function submitPrediction(event) {
    event.preventDefault();
    const prediction = predictionDraft.trim();
    if (
      !prediction ||
      predictionLoading ||
      !currentMessage?.reflectionPrompt ||
      !currentSpeaker.id
    )
      return;

    setPredictionLoading(true);
    setPredictionError("");
    setPredictionFeedback("");
    const requestId = ++predictionRequest.current;
    try {
      const data = await api(`/lessons/${lesson.id}/doubts`, {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          message_id: currentMessage.id || null,
          character_id: currentSpeaker.id,
          question: `For "${currentMessage.reflectionPrompt}", my prediction is: "${prediction}". Respond to my specific prediction in a supportive, conversational teaching tone. Tell me what I got right, gently correct anything I misunderstood, and explain the accurate concept.`,
        }),
      });
      if (typeof data.answer !== "string" || !data.answer.trim())
        throw new Error("The character couldn't check that prediction. Please try again.");
      if (requestId === predictionRequest.current) {
        setPredictionFeedback(data.answer);
        setDoubtHistory((items) => [...items, data]);
      }
    } catch (e) {
      if (requestId === predictionRequest.current) setPredictionError(e.message);
    } finally {
      if (requestId === predictionRequest.current) setPredictionLoading(false);
    }
  }

  async function submitTeachBack(event) {
    event.preventDefault();
    const response = teachBackDraft.trim();
    if (!response || teachBackLoading || !lesson?.id) return;

    setTeachBackLoading(true);
    setTeachBackError("");
    setTeachBackReply("");
    setTeachBackReport(null);
    const requestId = ++teachBackRequest.current;
    try {
      const data = await api(`/lessons/${lesson.id}/teach-back-attempts`, {
        method: "POST",
        body: JSON.stringify({
          client_id: clientId,
          response,
        }),
      });
      if (!data.report || !data.ratings || typeof data.response !== "string")
        throw new Error("Feedback wasn't available. Please try again.");
      if (requestId === teachBackRequest.current) {
        setTeachBackReport(data);
        setTeachBackReply(data.report.summary);
        setTeachBackAttempts((items) => [...items, data]);
      }
    } catch (e) {
      if (requestId === teachBackRequest.current)
        setTeachBackError(e.message);
    } finally {
      if (requestId === teachBackRequest.current)
        setTeachBackLoading(false);
    }
  }

  const cast = useMemo(
    () => Object.fromEntries((lesson?.characters || []).map((c) => [c.id, c])),
    [lesson],
  );
  const historyRecommendations = useMemo(() => {
    const visited = new Set(
      history.map((item) => item.topic?.trim().toLowerCase()).filter(Boolean),
    );
    const categoryMatchers = [
      /finance|money|budget|saving|price|interest|bank|credit|invest/i,
      /biology|cell|plant|dna|gene|immune|food chain|brain|evolution|health/i,
      /algorithm|data structure|search|sort|array|stack|queue|tree|hash map|maze/i,
      /technology|internet|computer|api|website|server|artificial intelligence|machine learning|cloud|encrypt|software|redis/i,
    ];

    return history.slice(0, 2).map((source) => {
      const sourceTopic = (source.topic || "this topic").trim();
      const categoryIndex = categoryMatchers.findIndex((pattern) =>
        pattern.test(sourceTopic),
      );
      const category =
        categoryIndex >= 0 ? topicCategories[categoryIndex] : null;
      const suggestions =
        category?.topics[topicAudience] || category?.topics.all || [];
      const relatedTopic = suggestions.find(
        (suggestion) => !visited.has(suggestion.toLowerCase()),
      );

      return {
        source,
        relatedTopic:
          relatedTopic ||
          `Real-world applications of ${sourceTopic}`.slice(0, 300),
      };
    });
  }, [history, topicAudience]);

  const currentMessage = lesson?.conversation?.[gossipIndex];
  const currentSpeechMessageKey = currentMessage
    ? currentMessage.id ?? `${lesson.id}:${gossipIndex}`
    : null;
  autoplayRef.current = autoplay;
  lessonRef.current = lesson;
  gossipIndexRef.current = gossipIndex;
  currentSpeechMessageKeyRef.current = currentSpeechMessageKey;
  speechEnabledRef.current = speechEnabled;
  autoplayPausedRef.current = autoplayPaused;
  const currentSpeaker = currentMessage
    ? cast[currentMessage.characterId] || {}
    : {};
  useEffect(() => {
    if (
      !speechEnabled ||
      !lesson ||
      tab !== "gossip" ||
      conversationComplete
    )
      return;
    const text = currentMessage?.text || "";
    if (
      !text ||
      typedMessageKey !== currentSpeechMessageKey ||
      visibleText.length < text.length ||
      speechUtterance.current
    )
      return;

    const utterance = new SpeechSynthesisUtterance(text);
    speechUtterance.current = utterance;
    speechUtteranceKey.current = currentSpeechMessageKey;
    setSpeechPlaying(true);
    utterance.onend = () => {
      if (speechUtterance.current !== utterance) return;
      speechUtterance.current = null;
      speechUtteranceKey.current = null;
      setSpeechPlaying(false);
      if (autoplayAdvancePending.current === currentSpeechMessageKey) {
        if (!autoplayPausedRef.current) {
          autoplayAdvancePending.current = null;
          advanceAutoplay(currentSpeechMessageKey);
        }
      }
    };
    utterance.onerror = (event) => {
      if (speechUtterance.current !== utterance) return;
      speechUtterance.current = null;
      speechUtteranceKey.current = null;
      setSpeechPlaying(false);
      if (event.error !== "canceled" && event.error !== "interrupted")
        setSpeechError(
          "Speech playback stopped unexpectedly. Please try again.",
        );
      if (autoplayAdvancePending.current === currentSpeechMessageKey) {
        if (!autoplayPausedRef.current) {
          autoplayAdvancePending.current = null;
          advanceAutoplay(currentSpeechMessageKey);
        }
      }
    };
    window.speechSynthesis.speak(utterance);
    return () => {
      if (speechUtterance.current !== utterance) return;
      speechUtterance.current = null;
      speechUtteranceKey.current = null;
      window.speechSynthesis.cancel();
      setSpeechPlaying(false);
    };
  }, [
    speechEnabled,
    lesson,
    tab,
    conversationComplete,
    currentMessage,
    currentSpeechMessageKey,
    typedMessageKey,
    visibleText,
    gossipIndex,
  ]);
  useEffect(() => {
    predictionRequest.current += 1;
    setPredictionDraft("");
    setPredictionFeedback("");
    setPredictionError("");
    setPredictionLoading(false);
  }, [lesson?.id, currentMessage?.id]);
  const lastMessageReady =
    lesson &&
    gossipIndex === lesson.conversation.length - 1 &&
    typedMessageKey === currentSpeechMessageKey &&
    visibleText.length >= (currentMessage?.text || "").length;

  function showFullMessage() {
    if (typingTimerRef.current) {
      clearInterval(typingTimerRef.current);
      typingTimerRef.current = null;
    }
    setVisibleText(currentMessage?.text || "");
    setTypedMessageKey(currentSpeechMessageKey);
  }

  function cancelSpeech() {
    autoplayAdvancePending.current = null;
    speechUtterance.current = null;
    speechUtteranceKey.current = null;
    setSpeechPlaying(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window)
      window.speechSynthesis.cancel();
  }

  function toggleSpeech() {
    setSpeechError("");
    if (speechEnabled) {
      const pendingAdvance = autoplayAdvancePending.current;
      cancelSpeech();
      setSpeechEnabled(false);
      if (pendingAdvance) advanceAutoplay(pendingAdvance);
    } else if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      setSpeechEnabled(true);
    }
  }

  function toggleAutoplay() {
    if (autoplay) {
      setAutoplayCountdown(null);
      autoplayTimerRef.current = null;
      autoplayAdvancePending.current = null;
      setAutoplayPaused(false);
      autoplayPausedRef.current = false;
      setAutoplay(false);
      return;
    }
    setAutoplayPaused(false);
    autoplayPausedRef.current = false;
    setAutoplay(true);
  }

  function toggleAutoplayPause() {
    const nextPaused = !autoplayPausedRef.current;
    autoplayPausedRef.current = nextPaused;
    setAutoplayPaused(nextPaused);
    if (
      !nextPaused &&
      autoplayAdvancePending.current &&
      !speechUtterance.current
    ) {
      const messageKey = autoplayAdvancePending.current;
      autoplayAdvancePending.current = null;
      advanceAutoplay(messageKey);
    }
  }

  function renderMessageFollowUps(message, character, messageKey) {
    const savedFollowUps = doubtHistory.filter(
      (item) =>
        message?.id &&
        item.message_id === message?.id &&
        getMessageFollowUpMode(item.question),
    );
    const isOpen = openFollowUpKey === messageKey;
    const isLoadingMessage = followUpLoadingKey.startsWith(`${messageKey}:`);
    return (
      <div className="message-followups">
        <button
          type="button"
          className="message-followups-trigger"
          onClick={() => {
            setOpenFollowUpKey(isOpen ? "" : messageKey);
            setFollowUpError("");
            setFollowUpErrorKey("");
          }}
          aria-expanded={isOpen}
          aria-controls={`follow-ups-${messageKey}`}
          disabled={!message?.id || !character?.id}
          title={
            !message?.id
              ? "Follow-ups are unavailable for this message"
              : undefined
          }
        >
          <Sparkles />
          {isOpen ? "Hide follow-ups" : "Explore this message"}
        </button>
        {isOpen && (
          <div
            className="message-followups-panel"
            id={`follow-ups-${messageKey}`}
          >
            <div className="message-followup-options">
              {messageFollowUps.map((option) => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() =>
                    askMessageFollowUp(
                      option.id,
                      message,
                      character,
                      messageKey,
                    )
                  }
                  disabled={!!followUpLoadingKey}
                >
                  {followUpLoadingKey === `${messageKey}:${option.id}` ? (
                    <LoaderCircle className="spin" />
                  ) : (
                    <ArrowRight />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
            {isLoadingMessage && (
              <p className="message-followup-status" role="status">
                Preparing a response…
              </p>
            )}
            {followUpErrorKey === messageKey && followUpError && (
              <p className="message-followup-error" role="alert">
                {followUpError}
              </p>
            )}
            {savedFollowUps.map((item) => {
              const option = getMessageFollowUpMode(item.question);
              return (
                <article className="message-followup-answer" key={item.id}>
                  <b>{option?.label || "Follow-up"}</b>
                  <p>{item.answer}</p>
                </article>
              );
            })}
          </div>
        )}
      </div>
    );
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
            cancelSpeech();
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
            {historyRecommendations.length > 0 && (
              <section
                className="history-recommendations"
                aria-labelledby="history-recommendations-title"
              >
                <div className="history-recommendations-heading">
                  <div>
                    <span>BASED ON YOUR RECENT TEA</span>
                    <h2 id="history-recommendations-title">
                      Keep your curiosity going
                    </h2>
                    <p>
                      Pick up where you left off or branch into a related idea.
                    </p>
                  </div>
                  <History aria-hidden="true" />
                </div>
                <div className="history-recommendation-grid">
                  {historyRecommendations.map(({ source, relatedTopic }) => (
                    <article
                      className="history-recommendation"
                      key={source.id}
                    >
                      <p className="history-recommendation-source">
                        Because you explored <b>{source.topic}</b>
                      </p>
                      <button
                        type="button"
                        onClick={() => generateDeeperLesson(source)}
                        disabled={loading}
                      >
                        <span className="history-recommendation-icon">
                          <Sparkles />
                        </span>
                        <span>
                          <b>Go deeper</b>
                          <small>
                            Explore the mechanisms, trade-offs, and edge cases
                          </small>
                        </span>
                        <ArrowUpRight />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTopic(relatedTopic);
                          generate(relatedTopic);
                        }}
                        disabled={loading}
                      >
                        <span className="history-recommendation-icon">
                          <ArrowRight />
                        </span>
                        <span>
                          <b>Explore a related topic</b>
                          <small>{relatedTopic}</small>
                        </span>
                        <ArrowUpRight />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
            <section className="topic-explorer" aria-labelledby="topic-explorer-title">
              <div className="topic-explorer-heading">
                <div>
                  <span>NEED A TOPIC?</span>
                  <h2 id="topic-explorer-title">Pick a curiosity to explore</h2>
                  <p>Browse money, science, coding, technology, and everyday ideas.</p>
                </div>
                <label className="topic-audience">
                  <span>IDEAS FOR</span>
                  <select
                    value={topicAudience}
                    onChange={(event) => setTopicAudience(event.target.value)}
                    aria-label="Choose an age group for topic suggestions"
                  >
                    {topicAudiences.map((audience) => (
                      <option key={audience.id} value={audience.id}>
                        {audience.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="topic-category-grid">
                {topicCategories.map((category) => (
                  <div className="topic-category" key={category.name}>
                    <h3>{category.name}</h3>
                    <div className="topic-suggestions">
                      {(category.topics[topicAudience] || category.topics.all).map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setTopic(suggestion);
                            generate(suggestion);
                          }}
                        >
                          {suggestion}
                          <ArrowUpRight size={13} />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
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
              <button
                onClick={() => {
                  cancelSpeech();
                  setLesson(null);
                }}
              >
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
                  onClick={() => {
                    if (id !== tab) cancelSpeech();
                    setTab(id);
                  }}
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
                      className={`conversation-speech ${speechEnabled ? "on" : ""}`}
                      onClick={toggleSpeech}
                      disabled={
                        typeof window !== "undefined" &&
                        !("speechSynthesis" in window)
                      }
                      aria-label={
                        speechEnabled
                          ? "Turn conversation read aloud off"
                          : "Turn conversation read aloud on"
                      }
                      aria-pressed={speechEnabled}
                      title={
                        typeof window !== "undefined" &&
                        !("speechSynthesis" in window)
                          ? "Text-to-speech is not supported in this browser"
                          : undefined
                      }
                    >
                      <Volume2 />
                      Read aloud: {speechEnabled ? "On" : "Off"}
                    </button>
                    {speechPlaying && (
                      <small className="speech-speaking" aria-live="polite">
                        Speaking
                      </small>
                    )}
                    <button
                      className={autoplay ? "on" : ""}
                      onClick={toggleAutoplay}
                    >
                      {autoplay ? <Pause /> : <Play />} Autoplay
                    </button>
                  </div>
                </div>
                {speechError && (
                  <p className="speech-error" role="alert">
                    {speechError}
                  </p>
                )}
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
                            </div>
                            <div
                              className={`message-bubble ${currentMessage?.kind || ""} ${
                                autoplayCountdown?.messageKey ===
                                currentSpeechMessageKey
                                  ? "autoplay-active"
                                  : ""
                              }`}
                            >
                              <p>
                                {visibleText}
                                <i className="typing-caret" />
                              </p>
                              {autoplayCountdown?.messageKey ===
                                currentSpeechMessageKey && (
                                <>
                                  <button
                                    className="autoplay-pause"
                                    onClick={toggleAutoplayPause}
                                    aria-label={
                                      autoplayPaused
                                        ? "Resume autoplay timer"
                                        : "Pause autoplay timer"
                                    }
                                    title={
                                      autoplayPaused
                                        ? "Resume autoplay"
                                        : "Pause autoplay to answer the prediction"
                                    }
                                  >
                                    {autoplayPaused ? <Play /> : <Pause />}
                                  </button>
                                  <div
                                    className={`autoplay-countdown ${
                                      autoplayPaused ? "paused" : ""
                                    }`}
                                    role="progressbar"
                                    aria-label="Time until the next message"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={Math.round(
                                      autoplayCountdown.progress * 100,
                                    )}
                                  >
                                    <span
                                      style={{
                                        width: `${autoplayCountdown.progress * 100}%`,
                                      }}
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                            {currentMessage?.reflectionPrompt &&
                              visibleText.length ===
                                currentMessage.text.length && (
                                <div className="reflection-cue">
                                  <b>Your turn to predict</b>
                                  <p className="prediction-question">
                                    {currentMessage.reflectionPrompt}
                                  </p>
                                  <form
                                    className="prediction-form"
                                    onSubmit={submitPrediction}
                                  >
                                    <label
                                      className="sr-only"
                                      htmlFor="prediction-answer"
                                    >
                                      Your prediction
                                    </label>
                                    <textarea
                                      id="prediction-answer"
                                      value={predictionDraft}
                                      disabled={predictionLoading}
                                      onChange={(event) => {
                                        setPredictionDraft(event.target.value);
                                        setPredictionFeedback("");
                                        setPredictionError("");
                                      }}
                                      placeholder="Share what you think will happen and why…"
                                      maxLength={500}
                                      rows={2}
                                    />
                                    <button
                                      type="submit"
                                      disabled={
                                        !predictionDraft.trim() ||
                                        predictionLoading
                                      }
                                    >
                                      {predictionLoading ? (
                                        <LoaderCircle className="spin" />
                                      ) : (
                                        <Send />
                                      )}
                                      {predictionLoading
                                        ? "Checking…"
                                        : "Check my prediction"}
                                    </button>
                                  </form>
                                  {predictionError && (
                                    <p
                                      className="prediction-error"
                                      role="alert"
                                    >
                                      {predictionError}
                                    </p>
                                  )}
                                  {predictionFeedback && (
                                    <div
                                      className="prediction-feedback"
                                      aria-live="polite"
                                    >
                                      <span>{currentSpeaker.avatar}</span>
                                      <div>
                                        <b>
                                          {currentSpeaker.name}'s feedback
                                        </b>
                                        <p>{predictionFeedback}</p>
                                      </div>
                                    </div>
                                  )}
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
                        {renderMessageFollowUps(
                          currentMessage,
                          currentSpeaker,
                          String(currentSpeechMessageKey),
                        )}
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
                          cancelSpeech();
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
                          if (
                            typedMessageKey !== currentSpeechMessageKey ||
                            visibleText.length < full.length
                          ) {
                            showFullMessage();
                          } else if (lastMessageReady) {
                            cancelSpeech();
                            setAutoplay(false);
                            setAutoplayCountdown(null);
                            setConversationComplete(true);
                          } else {
                            cancelSpeech();
                            setGossipIndex((i) => i + 1);
                            setDoubtCharacter(null);
                            setDoubtReply("");
                          }
                        }}
                      >
                        {typedMessageKey !== currentSpeechMessageKey ||
                        visibleText.length <
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
                        (item) =>
                          item.message_id === m.id &&
                          !getTeachBackResponse(item.question) &&
                          !getMessageFollowUpMode(item.question),
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
                          {renderMessageFollowUps(
                            m,
                            c,
                            String(m.id || `transcript-${i}`),
                          )}
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
            {tab === "technical" && (
              <section className="technical-explanation">
                <div className="technical-heading">
                  <span>THE SYSTEM, WITHOUT THE STORY</span>
                  <h2>{lesson.topic}</h2>
                  <p>{lesson.topicSummary}</p>
                  <small>
                    A direct explanation at the {lesson.level.toLowerCase()}{" "}
                    level. These concepts describe how the real system works;
                    story analogies are left behind.
                  </small>
                </div>
                <div className="technical-concepts">
                  <div className="technical-section-heading">
                    <span>CORE MECHANICS</span>
                    <h3>How the parts work together</h3>
                  </div>
                  {(lesson.realityCheck || []).map((item, index) => (
                    <article className="technical-concept" key={`${item.concept}-${index}`}>
                      <span className="technical-step">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h4>{item.concept}</h4>
                        <p>{item.actualMeaning}</p>
                      </div>
                      {index < lesson.realityCheck.length - 1 && (
                        <span className="technical-connector" aria-hidden="true" />
                      )}
                    </article>
                  ))}
                  {!lesson.realityCheck?.length && (
                    <p className="technical-empty">
                      A detailed technical explanation is not available for
                      this lesson yet.
                    </p>
                  )}
                </div>
                <section className="teach-back">
                  <div className="technical-section-heading">
                    <span>MAKE IT YOURS</span>
                    <h3>Explain it in your own words</h3>
                    <p>
                      Try describing how the system works. Get supportive,
                      specific feedback, then revise and try again. This is
                      practice—not a grade.
                    </p>
                  </div>
                  <form className="teach-back-form" onSubmit={submitTeachBack}>
                    <label className="sr-only" htmlFor="teach-back-response">
                      Explain the topic in your own words
                    </label>
                    <textarea
                      id="teach-back-response"
                      value={teachBackDraft}
                      onChange={(event) => {
                        setTeachBackDraft(event.target.value);
                        setTeachBackReply("");
                        setTeachBackReport(null);
                        setTeachBackError("");
                      }}
                      placeholder="What are the key parts, and how do they work together?"
                      maxLength={250}
                      rows={4}
                    />
                    <div className="teach-back-actions">
                      <small>{teachBackDraft.length}/250</small>
                      <button
                        type="submit"
                        disabled={!teachBackDraft.trim() || teachBackLoading}
                      >
                        {teachBackLoading ? (
                          <LoaderCircle className="spin" />
                        ) : (
                          <Send />
                        )}
                        {teachBackLoading ? "Reviewing…" : "Get feedback"}
                      </button>
                    </div>
                  </form>
                  {teachBackError && (
                    <p className="teach-back-error" role="alert">
                      {teachBackError}
                    </p>
                  )}
                  {teachBackReply && (
                    <div className="teach-back-feedback" aria-live="polite">
                      <span>
                        {lesson.characters?.[0]?.avatar || <Sparkles />}
                      </span>
                      <div>
                        <b>Feedback to help you refine it</b>
                        <p>{teachBackReply}</p>
                        {teachBackReport && (
                          <>
                            <div className="teach-back-ratings">
                              {[
                                ["Accuracy", teachBackReport.ratings.accuracy],
                                ["Completeness", teachBackReport.ratings.completeness],
                                ["Clarity", teachBackReport.ratings.clarity],
                              ].map(([label, rating]) => (
                                <span key={label}>
                                  <b>{label}</b>
                                  {rating}/5
                                </span>
                              ))}
                            </div>
                            <small className="teach-back-rating-note">
                              Guidance only: 1 means needs more support; 5 means
                              clear and accurate.
                            </small>
                            <TeachBackReport report={teachBackReport.report} />
                          </>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="teach-back-history">
                    <h3>Your previous explanations</h3>
                    {teachBackHistoryError && (
                      <p className="teach-back-error" role="alert">
                        Couldn’t load saved attempts: {teachBackHistoryError}
                      </p>
                    )}
                    {teachBackAttempts
                      .slice()
                      .reverse()
                      .map((attempt) => (
                        <article
                          className="teach-back-attempt"
                          key={`saved-${attempt.id}`}
                        >
                          <div>
                            <b>Your explanation</b>
                            <p>{attempt.response}</p>
                          </div>
                          {attempt.status === "completed" && attempt.report ? (
                            <>
                              <div className="teach-back-ratings">
                                {[
                                  ["Accuracy", attempt.ratings?.accuracy],
                                  ["Completeness", attempt.ratings?.completeness],
                                  ["Clarity", attempt.ratings?.clarity],
                                ].map(([label, rating]) => (
                                  <span key={label}>
                                    <b>{label}</b>
                                    {rating ?? "—"}/5
                                  </span>
                                ))}
                              </div>
                              <small className="teach-back-rating-note">
                                Guidance only: 1 means needs more support; 5
                                means clear and accurate.
                              </small>
                              <TeachBackReport report={attempt.report} />
                            </>
                          ) : (
                            <p className="teach-back-attempt-status">
                              {attempt.status === "failed"
                                ? "Feedback could not be generated for this attempt."
                                : "Feedback is still processing."}
                            </p>
                          )}
                        </article>
                      ))}
                    {doubtHistory
                      .filter((item) => getTeachBackResponse(item.question))
                      .slice()
                      .reverse()
                      .map((attempt) => (
                        <article
                          className="teach-back-attempt"
                          key={attempt.id}
                        >
                          <div>
                            <b>Your explanation</b>
                            <p>{getTeachBackResponse(attempt.question)}</p>
                          </div>
                          <div>
                            <b>Feedback</b>
                            <p>{attempt.answer}</p>
                          </div>
                        </article>
                      ))}
                    {!teachBackAttempts.length &&
                      !doubtHistory.some((item) =>
                        getTeachBackResponse(item.question),
                      ) && (
                      <p className="teach-back-empty">
                        Your submissions and feedback will appear here.
                      </p>
                    )}
                  </div>
                </section>
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
                    onClick={toggleAutoplay}
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
