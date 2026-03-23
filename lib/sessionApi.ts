import type { Scenario } from "@/lib/game";
import {
  buildLeaderboard,
  type Phase,
  type PlayerState,
  type Session,
} from "@/lib/sessionStore";

function scenarioForPlayer(
  scenario: Scenario | null,
  phase: Phase,
): (Omit<Scenario, "answer"> & { answer: number | null }) | null {
  if (!scenario) return null;
  if (phase === "question") {
    const { answer: _a, ...rest } = scenario;
    return { ...rest, answer: null };
  }
  return { ...scenario };
}

function rankOfPlayer(session: Session, playerId: string): number {
  const sorted = [...session.players.values()].sort(
    (a, b) => b.totalScore - a.totalScore || a.name.localeCompare(b.name),
  );
  const idx = sorted.findIndex((p) => p.id === playerId);
  return idx >= 0 ? idx + 1 : 0;
}

export type HostPollResponse = {
  role: "host";
  code: string;
  phase: Phase;
  timeLimitMs: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  scenario: Scenario | null;
  players: {
    id: string;
    name: string;
    totalScore: number;
    answeredThisRound: boolean;
    lastRoundPoints: number;
  }[];
  leaderboard: ReturnType<typeof buildLeaderboard>;
};

export type PlayerPollResponse = {
  role: "player";
  code: string;
  phase: Phase;
  timeLimitMs: number;
  totalQuestions: number;
  currentQuestionIndex: number;
  questionStartedAt: number | null;
  scenario: (Omit<Scenario, "answer"> & { answer: number | null }) | null;
  myPlayerId: string;
  myTotalScore: number;
  myRank: number;
  answeredThisRound: boolean;
  lastRoundPoints: number;
  lastRoundCorrect: boolean | null;
  leaderboard: ReturnType<typeof buildLeaderboard>;
};

export function buildHostResponse(session: Session): HostPollResponse {
  return {
    role: "host",
    code: session.code,
    phase: session.phase,
    timeLimitMs: session.timeLimitMs,
    totalQuestions: session.totalQuestions,
    currentQuestionIndex: session.currentQuestionIndex,
    questionStartedAt: session.questionStartedAt,
    scenario: session.scenario,
    players: [...session.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      totalScore: p.totalScore,
      answeredThisRound: p.answeredThisRound,
      lastRoundPoints: p.lastRoundPoints,
    })),
    leaderboard: buildLeaderboard(session),
  };
}

export function buildPlayerResponse(
  session: Session,
  player: PlayerState,
): PlayerPollResponse {
  return {
    role: "player",
    code: session.code,
    phase: session.phase,
    timeLimitMs: session.timeLimitMs,
    totalQuestions: session.totalQuestions,
    currentQuestionIndex: session.currentQuestionIndex,
    questionStartedAt: session.questionStartedAt,
    scenario: scenarioForPlayer(session.scenario, session.phase),
    myPlayerId: player.id,
    myTotalScore: player.totalScore,
    myRank: rankOfPlayer(session, player.id),
    answeredThisRound: player.answeredThisRound,
    lastRoundPoints: player.lastRoundPoints,
    lastRoundCorrect: player.lastRoundCorrect,
    leaderboard: buildLeaderboard(session),
  };
}
