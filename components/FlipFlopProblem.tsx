"use client";

import type { FlipFlopType } from "@/lib/game";
import { typeBadgeClasses } from "@/lib/game";

type ScenarioLike = {
  type: FlipFlopType;
  state: 0 | 1;
  inputsText: string;
};

type Props = {
  scenario: ScenarioLike;
  /** Solo anfitrión / tras ronda */
  showCorrect?: boolean;
  correctAnswer?: 0 | 1 | null;
  /** Feedback local (modo solitario) */
  feedback?: "none" | "correct" | "wrong";
};

export function FlipFlopProblem({
  scenario,
  showCorrect = false,
  correctAnswer = null,
  feedback = "none",
}: Props) {
  return (
    <>
      <div className="mb-6 text-center">
        <span className="uppercase tracking-widest text-slate-400 text-sm font-semibold block mb-1">
          Tipo de Flip-Flop
        </span>
        <div
          className={`inline-block text-center ${typeBadgeClasses(scenario.type)}`}
        >
          {scenario.type}
        </div>
      </div>

      <div className="w-full max-w-sm bg-slate-900 rounded-xl p-6 border border-slate-700 shadow-lg relative overflow-hidden">
        <div className="absolute right-4 top-4 flex items-center gap-1 opacity-50">
          <div className="w-3 h-3 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-xs font-bold text-cyan-500">CLK</span>
        </div>

        <div className="grid grid-cols-2 gap-6 text-center">
          <div>
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block mb-2">
              Estado Actual (Q)
            </span>
            <div className="mono text-5xl font-bold text-slate-300 min-h-[3rem] flex items-center justify-center gap-1 flex-wrap">
              {feedback === "wrong" && correctAnswer !== null ? (
                <>
                  <span className="text-red-500 line-through">{scenario.state}</span>{" "}
                  <span className="text-green-400">-&gt; {correctAnswer}</span>
                </>
              ) : (
                scenario.state
              )}
            </div>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase font-bold tracking-wider block mb-2">
              Entradas
            </span>
            <div className="mono text-3xl font-bold text-yellow-400 mt-2">
              {scenario.inputsText}
            </div>
          </div>
        </div>
      </div>

      {showCorrect && correctAnswer !== null && correctAnswer !== undefined && (
        <p className="mt-4 text-center text-sm font-semibold text-emerald-400">
          Respuesta correcta: <span className="mono text-lg">{correctAnswer}</span>
        </p>
      )}
    </>
  );
}
