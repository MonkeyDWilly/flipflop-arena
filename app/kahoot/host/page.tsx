"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FlipFlopProblem } from "@/components/FlipFlopProblem";
import { KahootLeaderboardTable } from "@/components/KahootLeaderboardTable";
import { LanMultiplayerHint } from "@/components/LanMultiplayerHint";
import type { HostPollResponse } from "@/lib/sessionApi";
import { MAX_POINTS_PER_QUESTION } from "@/lib/scoring";
import {
  DEFAULT_TIME_LIMIT_SEC,
  DEFAULT_TOTAL_QUESTIONS,
} from "@/lib/sessionStore";

const POLL_MS = 500;

function useRemainingMs(
  questionStartedAt: number | null,
  timeLimitMs: number,
  active: boolean,
) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    if (!active || !questionStartedAt) {
      setMs(0);
      return;
    }
    const tick = () => {
      const end = questionStartedAt + timeLimitMs;
      setMs(Math.max(0, end - Date.now()));
    };
    tick();
    const id = setInterval(tick, 200);
    return () => clearInterval(id);
  }, [questionStartedAt, timeLimitMs, active]);
  return ms;
}

const STORAGE_KEY = "flipflop_kahoot_host";

export default function KahootHostPage() {
  const [timeLimitSec, setTimeLimitSec] = useState(DEFAULT_TIME_LIMIT_SEC);
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);
  const [code, setCode] = useState<string | null>(null);
  const [hostToken, setHostToken] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [poll, setPoll] = useState<HostPollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const j = JSON.parse(raw) as { code: string; hostToken: string };
        if (j.code && j.hostToken) {
          setCode(j.code);
          setHostToken(j.hostToken);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  const resetHostStorage = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setCode(null);
    setHostToken(null);
    setPoll(null);
    setError(null);
  }, []);

  const fetchState = useCallback(async () => {
    if (!code || !hostToken) return;
    const r = await fetch(
      `/api/sessions/${code}?hostToken=${encodeURIComponent(hostToken)}`,
    );
    if (r.status === 404) {
      resetHostStorage();
      setError(
        "Esta sala ya no existe en el servidor (p. ej. al reiniciar el servidor de desarrollo). Crea una sala nueva.",
      );
      return;
    }
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Error de sala");
    }
    const data = (await r.json()) as HostPollResponse;
    setPoll(data);
    setError(null);
  }, [code, hostToken, resetHostStorage]);

  useEffect(() => {
    if (!code || !hostToken) return;
    let cancelled = false;
    const run = () => {
      fetchState().catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    };
    run();
    const id = setInterval(run, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [code, hostToken, fetchState]);

  const createSession = async () => {
    setCreating(true);
    setError(null);
    try {
      const r = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timeLimitSec,
          totalQuestions,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Error");
      const c = (j as { code: string; hostToken: string }).code;
      const h = (j as { hostToken: string }).hostToken;
      setCode(c);
      setHostToken(h);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ code: c, hostToken: h }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  const postHost = async (path: string) => {
    if (!code || !hostToken) return;
    setActionLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/sessions/${code}${path}`, {
        method: "POST",
        headers: { "x-host-token": hostToken },
      });
      if (r.status === 404) {
        resetHostStorage();
        setError(
          "Esta sala ya no existe en el servidor (p. ej. al reiniciar el servidor de desarrollo). Crea una sala nueva.",
        );
        return;
      }
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Error");
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setActionLoading(false);
    }
  };

  const startGame = () => postHost("/start");
  const advance = () => postHost("/next");

  const remainingMs = useRemainingMs(
    poll?.questionStartedAt ?? null,
    poll?.timeLimitMs ?? 0,
    poll?.phase === "question",
  );

  if (!code || !hostToken) {
    return (
      <div className="max-w-xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-8">
        <h1 className="text-2xl font-bold text-white mb-2">Nueva sala</h1>
        <p className="text-slate-400 text-sm mb-6">
          Configura el límite de tiempo por pregunta y el número de preguntas.
          Los jugadores que acierten reciben hasta {MAX_POINTS_PER_QUESTION}{" "}
          puntos; cuanto más rápido respondan, más puntos. Un error suma 0.
        </p>
        <div className="grid gap-4 mb-6">
          <label className="block">
            <span className="text-slate-300 text-sm font-medium">
              Segundos por pregunta
            </span>
            <input
              type="number"
              min={5}
              max={120}
              value={timeLimitSec}
              onChange={(e) => setTimeLimitSec(Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-white"
            />
          </label>
          <label className="block">
            <span className="text-slate-300 text-sm font-medium">
              Número de preguntas
            </span>
            <input
              type="number"
              min={1}
              max={30}
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(Number(e.target.value))}
              className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-white"
            />
          </label>
        </div>
        {error && (
          <p className="text-red-400 text-sm mb-4" role="alert">
            {error}
          </p>
        )}
        <button
          type="button"
          disabled={creating}
          onClick={createSession}
          className="w-full py-3 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
        >
          {creating ? "Creando…" : "Crear sala"}
        </button>
        <p className="mt-6 text-center">
          <Link href="/" className="text-cyan-400 hover:underline text-sm">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    );
  }

  const phase = poll?.phase;

  return (
    <div className="max-w-3xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-slate-900 p-4 border-b border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-slate-400 text-xs uppercase tracking-wider">
            Código de sala
          </p>
          <p className="mono text-2xl font-black text-cyan-400 tracking-widest">
            {code}
          </p>
        </div>
        <div className="text-right text-sm text-slate-400">
          <div>
            Tiempo/pregunta:{" "}
            <span className="text-white font-mono">
              {Math.round((poll?.timeLimitMs ?? 0) / 1000)}s
            </span>
          </div>
          <div>
            Puntos máx./ronda:{" "}
            <span className="text-amber-300 font-mono">{MAX_POINTS_PER_QUESTION}</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-950/50 text-red-300 text-sm" role="alert">
          {error}
        </div>
      )}

      {!poll && (
        <div className="p-8 text-slate-400 text-center">Sincronizando…</div>
      )}

      {poll && phase === "lobby" && (
        <div className="p-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Sala lista — comparte el código
          </h2>
          <div className="mb-4">
            <LanMultiplayerHint joinPath={`/kahoot/join?code=${code}`} />
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Los jugadores entran desde{" "}
            <Link
              href={`/kahoot/join?code=${code}`}
              className="text-cyan-400 underline"
            >
              Unirse
            </Link>{" "}
            con el código <span className="mono text-white">{code}</span>.
          </p>
          <ul className="mb-6 space-y-2">
            {poll.players.length === 0 && (
              <li className="text-slate-500">Nadie se ha unido aún…</li>
            )}
            {poll.players.map((p) => (
              <li
                key={p.id}
                className="flex justify-between bg-slate-900/80 border border-slate-700 rounded-lg px-4 py-2 text-white"
              >
                <span>{p.name}</span>
                <span className="text-slate-500 text-sm">listo</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={actionLoading || poll.players.length < 1}
            onClick={startGame}
            className="w-full py-4 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white"
          >
            Iniciar partida
          </button>
        </div>
      )}

      {poll && phase === "question" && poll.scenario && (
        <div className="p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm">
              Pregunta {poll.currentQuestionIndex}/{poll.totalQuestions}
            </span>
            <span
              className={
                "mono text-3xl font-bold " +
                (remainingMs < 5000 ? "text-red-400" : "text-cyan-400")
              }
            >
              {(remainingMs / 1000).toFixed(1)}s
            </span>
          </div>
          <FlipFlopProblem scenario={poll.scenario} />
          <div className="mt-6 w-full max-w-md">
            <p className="text-slate-400 text-xs uppercase tracking-wider mb-2">
              Respuestas recibidas
            </p>
            <ul className="space-y-1 text-sm">
              {poll.players.map((p) => (
                <li
                  key={p.id}
                  className="flex justify-between text-slate-200 border border-slate-700 rounded px-3 py-1.5 bg-slate-900/60"
                >
                  <span>{p.name}</span>
                  <span
                    className={
                      p.answeredThisRound ? "text-emerald-400" : "text-slate-500"
                    }
                  >
                    {p.answeredThisRound ? "✓" : "…"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled={actionLoading}
            onClick={advance}
            className="mt-8 w-full max-w-md py-3 rounded-xl font-semibold bg-amber-600/90 hover:bg-amber-500 text-white"
          >
            Cerrar pregunta (puntuar ahora)
          </button>
          <p className="mt-2 text-xs text-slate-500 text-center">
            La ronda también se cierra sola cuando se acaba el tiempo o todos
            respondieron.
          </p>
        </div>
      )}

      {poll && phase === "leaderboard" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Clasificación
          </h2>
          <p className="text-slate-400 text-sm text-center mb-6">
            Ronda {poll.currentQuestionIndex} de {poll.totalQuestions}
          </p>
          {poll.scenario && (
            <div className="mb-8 flex flex-col items-center">
              <p className="text-slate-500 text-xs uppercase tracking-wider mb-3">
                Pregunta cerrada — respuesta correcta
              </p>
              <FlipFlopProblem
                scenario={poll.scenario}
                showCorrect
                correctAnswer={poll.scenario.answer}
              />
            </div>
          )}
          <KahootLeaderboardTable rows={poll.leaderboard} />
          <button
            type="button"
            disabled={actionLoading}
            onClick={advance}
            className="mt-8 w-full py-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            Siguiente
          </button>
        </div>
      )}

      {poll && phase === "final" && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Partida terminada
          </h2>
          <p className="text-slate-400 text-center mb-6">Resultados finales</p>
          <KahootLeaderboardTable rows={poll.leaderboard} showLastRound={false} />
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={resetHostStorage}
              className="w-full py-3 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white border border-slate-500"
            >
              Crear otra sala
            </button>
            <Link
              href="/"
              className="block text-center text-cyan-400 hover:underline text-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
