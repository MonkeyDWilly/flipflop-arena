"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FlipFlopProblem } from "@/components/FlipFlopProblem";
import { KahootLeaderboardTable } from "@/components/KahootLeaderboardTable";
import type { PlayerPollResponse } from "@/lib/sessionApi";
import { MAX_POINTS_PER_QUESTION } from "@/lib/scoring";

const POLL_MS = 500;

const PLAYER_KEY = (code: string) => `flipflop_kahoot_player_${code}`;

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

export default function KahootPlayPage() {
  const params = useParams();
  const router = useRouter();
  const code = String(params.code ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const [data, setData] = useState<PlayerPollResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [storedToken, setStoredToken] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    if (!code) return;
    const t = localStorage.getItem(PLAYER_KEY(code));
    setStoredToken(t ?? null);
    if (!t) {
      router.replace(`/kahoot/join?code=${code}`);
    }
  }, [code, router]);

  const fetchState = useCallback(async () => {
    const t = localStorage.getItem(PLAYER_KEY(code));
    if (!t) return;
    const r = await fetch(
      `/api/sessions/${code}?playerToken=${encodeURIComponent(t)}`,
    );
    if (r.status === 403 || r.status === 404) {
      localStorage.removeItem(PLAYER_KEY(code));
      router.replace(`/kahoot/join?code=${code}`);
      return;
    }
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      throw new Error((j as { error?: string }).error ?? "Error");
    }
    const j = (await r.json()) as PlayerPollResponse;
    setData(j);
    setError(null);
  }, [code, router]);

  useEffect(() => {
    if (!code || !storedToken) return;
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
  }, [code, storedToken, fetchState]);

  const submitAnswer = async (choice: 0 | 1) => {
    const t = localStorage.getItem(PLAYER_KEY(code));
    if (!t || sending || !data || data.phase !== "question") return;
    if (data.answeredThisRound) return;
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/sessions/${code}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerToken: t, choice }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Error");
      await fetchState();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSending(false);
    }
  };

  const remainingMs = useRemainingMs(
    data?.questionStartedAt ?? null,
    data?.timeLimitMs ?? 0,
    data?.phase === "question",
  );

  if (!code) {
    return (
      <p className="text-red-400">
        Código inválido. <Link href="/kahoot/join">Unirse</Link>
      </p>
    );
  }

  if (storedToken === undefined) {
    return (
      <div className="text-slate-400 p-8">
        Conectando…
      </div>
    );
  }

  if (storedToken === null) {
    return (
      <div className="text-slate-400 p-8">
        Redirigiendo al acceso…
      </div>
    );
  }

  if (!data && !error) {
    return (
      <div className="text-slate-400 p-8 w-full max-w-lg text-center">
        Conectando a la sala…
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="max-w-md w-full bg-slate-800 border border-red-900 rounded-xl p-6 text-red-300">
        {error}
        <Link href="/kahoot/join" className="block mt-4 text-cyan-400 underline">
          Volver a unirse
        </Link>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 flex flex-wrap justify-between items-center gap-2">
        <span className="text-slate-500 text-xs uppercase tracking-wider">
          {data.code}
        </span>
        <div className="flex gap-4 text-sm">
          <span className="text-slate-400">
            Tú:{" "}
            <span className="text-cyan-400 font-mono font-bold">
              {data.myTotalScore} pts
            </span>
          </span>
          <span className="text-slate-400">
            Pos.{" "}
            <span className="text-white font-mono font-bold">{data.myRank}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="px-4 py-2 bg-amber-950/40 text-amber-200 text-xs" role="alert">
          {error}
        </div>
      )}

      {data.phase === "lobby" && (
        <div className="p-10 text-center text-slate-300">
          <p className="mb-2">Estás en la sala.</p>
          <p className="text-slate-500 text-sm">
            Esperando a que el anfitrión inicie la partida…
          </p>
        </div>
      )}

      {data.phase === "question" && data.scenario && (
        <div className="p-6 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm">
              {data.currentQuestionIndex}/{data.totalQuestions}
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
          <p className="text-xs text-slate-500 mb-2 text-center">
            Hasta {MAX_POINTS_PER_QUESTION} pts si aciertas pronto; 0 si fallas.
          </p>
          <FlipFlopProblem scenario={data.scenario} />
          <div className="mt-8 text-center w-full max-w-sm">
            {data.answeredThisRound ? (
              <p className="text-emerald-400 font-semibold">
                Respuesta enviada. Esperando resultados…
              </p>
            ) : remainingMs <= 0 ? (
              <p className="text-red-400 font-semibold">Tiempo agotado</p>
            ) : (
              <div className="flex justify-center gap-6">
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => submitAnswer(0)}
                  className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-600 hover:border-cyan-400 hover:bg-slate-700 transition-all text-4xl mono font-bold text-white shadow-lg"
                >
                  0
                </button>
                <button
                  type="button"
                  disabled={sending}
                  onClick={() => submitAnswer(1)}
                  className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-600 hover:border-cyan-400 hover:bg-slate-700 transition-all text-4xl mono font-bold text-white shadow-lg"
                >
                  1
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {data.phase === "leaderboard" && (
        <div className="p-6">
          <h2 className="text-xl font-bold text-white text-center mb-2">
            Clasificación
          </h2>
          <p className="text-center text-sm text-slate-400 mb-2">
            {data.lastRoundCorrect === false
              ? "Sin puntos en esta ronda (incorrecto o fuera de tiempo)."
              : data.lastRoundCorrect && data.lastRoundPoints > 0
                ? `+${data.lastRoundPoints} pts en esta ronda`
                : data.lastRoundCorrect
                  ? "Acierto en el límite del tiempo: 0 pts."
                  : ""}
          </p>
          <KahootLeaderboardTable
            rows={data.leaderboard}
            highlightPlayerId={data.myPlayerId}
          />
        </div>
      )}

      {data.phase === "final" && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Fin del juego
          </h2>
          <p className="text-center text-slate-400 mb-6">
            Tu posición final:{" "}
            <span className="text-cyan-400 font-mono font-bold">{data.myRank}</span>{" "}
            · {data.myTotalScore} pts
          </p>
          <KahootLeaderboardTable
            rows={data.leaderboard}
            showLastRound={false}
            highlightPlayerId={data.myPlayerId}
          />
          <Link
            href="/"
            className="block text-center mt-8 text-cyan-400 hover:underline"
          >
            Salir al inicio
          </Link>
        </div>
      )}
    </div>
  );
}
