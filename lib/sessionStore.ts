import { generateScenario, type Scenario } from "@/lib/game";
import { computePointsForCorrectAnswer } from "@/lib/scoring";

export const DEFAULT_TOTAL_QUESTIONS = 10;
export const DEFAULT_TIME_LIMIT_SEC = 20;

export type Phase = "lobby" | "question" | "leaderboard" | "final";

export type PlayerState = {
  id: string;
  name: string;
  token: string;
  totalScore: number;
  lastRoundPoints: number;
  lastRoundCorrect: boolean | null;
  answeredThisRound: boolean;
  currentChoice: 0 | 1 | null;
  answerElapsedMs: number | null;
};

export type Session = {
  code: string;
  hostSecret: string;
  timeLimitMs: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  phase: Phase;
  scenario: Scenario | null;
  questionStartedAt: number | null;
  players: Map<string, PlayerState>;
  createdAt: number;
};

// Each route handler in Next.js + Turbopack evaluates modules in isolation,
// so a plain `const` Map would be a different instance per route.
// Anchoring to `globalThis` guarantees a single shared Map within the Node.js process.
declare global {
  // eslint-disable-next-line no-var
  var __flipflop_sessions: Map<string, Session> | undefined;
}
const sessions: Map<string, Session> =
  globalThis.__flipflop_sessions ??
  (globalThis.__flipflop_sessions = new Map());

function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function newPlayer(name: string): PlayerState {
  const id = crypto.randomUUID();
  return {
    id,
    name: name.trim().slice(0, 24) || "Jugador",
    token: crypto.randomUUID(),
    totalScore: 0,
    lastRoundPoints: 0,
    lastRoundCorrect: null,
    answeredThisRound: false,
    currentChoice: null,
    answerElapsedMs: null,
  };
}

function getDeadline(session: Session): number | null {
  if (!session.questionStartedAt) return null;
  return session.questionStartedAt + session.timeLimitMs;
}

function shouldFinalizeRound(session: Session): boolean {
  if (session.phase !== "question") return false;
  if (!session.questionStartedAt || !session.scenario) return false;
  const deadline = getDeadline(session);
  if (!deadline) return false;
  if (Date.now() >= deadline) return true;
  if (session.players.size === 0) return false;
  return [...session.players.values()].every((p) => p.answeredThisRound);
}

function finalizeRound(session: Session): void {
  if (session.phase !== "question" || !session.scenario || !session.questionStartedAt)
    return;

  const correctAnswer = session.scenario.answer;
  const timeLimit = session.timeLimitMs;
  const started = session.questionStartedAt;

  for (const p of session.players.values()) {
    p.lastRoundPoints = 0;
    p.lastRoundCorrect = false;

    if (p.currentChoice === null) continue;

    const elapsed = p.answerElapsedMs ?? timeLimit;
    if (elapsed > timeLimit) continue;

    if (p.currentChoice !== correctAnswer) continue;

    const pts = computePointsForCorrectAnswer(elapsed, timeLimit);
    p.totalScore += pts;
    p.lastRoundPoints = pts;
    p.lastRoundCorrect = true;
  }

  session.phase = "leaderboard";
}

export function tickSession(session: Session): void {
  if (shouldFinalizeRound(session)) {
    finalizeRound(session);
  }
}

function ensureSession(code: string): Session | undefined {
  const s = sessions.get(code.toUpperCase());
  return s;
}

export function createSession(input: {
  timeLimitSec: number;
  totalQuestions: number;
}): { code: string; hostSecret: string } {
  let code = randomCode();
  while (sessions.has(code)) {
    code = randomCode();
  }

  const timeLimitSec = Math.min(
    120,
    Math.max(5, Math.floor(input.timeLimitSec) || DEFAULT_TIME_LIMIT_SEC),
  );
  const totalQuestions = Math.min(
    30,
    Math.max(1, Math.floor(input.totalQuestions) || DEFAULT_TOTAL_QUESTIONS),
  );

  const session: Session = {
    code,
    hostSecret: crypto.randomUUID(),
    timeLimitMs: timeLimitSec * 1000,
    totalQuestions,
    currentQuestionIndex: 0,
    phase: "lobby",
    scenario: null,
    questionStartedAt: null,
    players: new Map(),
    createdAt: Date.now(),
  };

  sessions.set(code, session);
  return { code, hostSecret: session.hostSecret };
}

export function joinSession(
  code: string,
  name: string,
): { ok: true; playerToken: string; playerId: string } | { ok: false; error: string } {
  const session = ensureSession(code);
  if (!session) return { ok: false, error: "Sala no encontrada" };

  const player = newPlayer(name);
  session.players.set(player.id, player);
  return { ok: true, playerToken: player.token, playerId: player.id };
}

function resetPlayersForNewQuestion(session: Session): void {
  for (const p of session.players.values()) {
    p.answeredThisRound = false;
    p.currentChoice = null;
    p.answerElapsedMs = null;
    p.lastRoundPoints = 0;
    p.lastRoundCorrect = null;
  }
}

export function startGame(
  code: string,
  hostSecret: string,
):
  | { ok: true }
  | { ok: false; error: string } {
  const session = ensureSession(code);
  if (!session || session.hostSecret !== hostSecret) {
    return { ok: false, error: "No autorizado" };
  }
  if (session.phase !== "lobby") {
    return { ok: false, error: "La partida ya comenzó" };
  }
  if (session.players.size < 1) {
    return { ok: false, error: "Necesitas al menos un jugador" };
  }

  session.currentQuestionIndex = 1;
  session.scenario = generateScenario();
  session.questionStartedAt = Date.now();
  session.phase = "question";
  resetPlayersForNewQuestion(session);
  return { ok: true };
}

export function submitAnswer(
  code: string,
  playerToken: string,
  choice: 0 | 1,
):
  | { ok: true }
  | { ok: false; error: string } {
  const session = ensureSession(code);
  if (!session) return { ok: false, error: "Sala no encontrada" };
  tickSession(session);

  if (session.phase !== "question" || !session.scenario || !session.questionStartedAt) {
    return { ok: false, error: "No hay pregunta activa" };
  }

  const player = [...session.players.values()].find((p) => p.token === playerToken);
  if (!player) return { ok: false, error: "Jugador no encontrado" };

  if (player.answeredThisRound) {
    return { ok: false, error: "Ya respondiste" };
  }

  const elapsed = Date.now() - session.questionStartedAt;
  if (elapsed > session.timeLimitMs) {
    return { ok: false, error: "Tiempo agotado" };
  }

  player.answeredThisRound = true;
  player.currentChoice = choice;
  player.answerElapsedMs = elapsed;

  tickSession(session);
  return { ok: true };
}

/**
 * Desde `question`: cierra la ronda (fuerza puntuación) y pasa a `leaderboard`.
 * Desde `leaderboard`: siguiente pregunta o `final` si era la última.
 */
export function hostAdvance(
  code: string,
  hostSecret: string,
):
  | { ok: true }
  | { ok: false; error: string } {
  const session = ensureSession(code);
  if (!session || session.hostSecret !== hostSecret) {
    return { ok: false, error: "No autorizado" };
  }
  tickSession(session);

  if (session.phase === "question") {
    finalizeRound(session);
    return { ok: true };
  }

  if (session.phase === "final") {
    return { ok: true };
  }

  if (session.phase !== "leaderboard") {
    return { ok: false, error: "No se puede avanzar ahora" };
  }

  if (session.currentQuestionIndex >= session.totalQuestions) {
    session.phase = "final";
    return { ok: true };
  }

  session.currentQuestionIndex += 1;
  session.scenario = generateScenario();
  session.questionStartedAt = Date.now();
  session.phase = "question";
  resetPlayersForNewQuestion(session);
  return { ok: true };
}

export function getSessionByCode(code: string): Session | undefined {
  return ensureSession(code);
}

/** Llamar antes de leer estado (GET) para cerrar rondas por tiempo. */
export function getSessionAndTick(code: string): Session | undefined {
  const session = ensureSession(code);
  if (session) tickSession(session);
  return session;
}

export type LeaderboardRow = {
  rank: number;
  playerId: string;
  name: string;
  totalScore: number;
  lastRoundPoints: number;
  lastRoundCorrect: boolean | null;
};

export function buildLeaderboard(session: Session): LeaderboardRow[] {
  const rows = [...session.players.values()]
    .map((p) => ({
      playerId: p.id,
      name: p.name,
      totalScore: p.totalScore,
      lastRoundPoints: p.lastRoundPoints,
      lastRoundCorrect: p.lastRoundCorrect,
    }))
    .sort((a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name));

  return rows.map((r, i) => ({
    rank: i + 1,
    ...r,
  }));
}
