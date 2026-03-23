"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FlipFlopProblem } from "@/components/FlipFlopProblem";
import {
  generateScenario,
  type Scenario,
} from "@/lib/game";

const TOTAL_QUESTIONS = 10;

type Screen = "start" | "game" | "result";

export default function SoloPage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [feedback, setFeedback] = useState<"none" | "correct" | "wrong">(
    "none",
  );
  const [problemLocked, setProblemLocked] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPending = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => clearPending();
  }, [clearPending]);

  const startGame = () => {
    clearPending();
    setCurrentQuestion(1);
    setScore(0);
    setScreen("game");
    setProblemLocked(false);
    setFeedback("none");
    setScenario(generateScenario());
  };

  const checkAnswer = (selected: 0 | 1) => {
    if (!scenario || problemLocked) return;

    const isCorrect = selected === scenario.answer;
    setProblemLocked(true);

    if (isCorrect) {
      setScore((s) => s + 1);
      setFeedback("correct");
    } else {
      setFeedback("wrong");
    }

    clearPending();
    timeoutRef.current = setTimeout(() => {
      setFeedback("none");
      setProblemLocked(false);
      setCurrentQuestion((q) => {
        const next = q + 1;
        if (next > TOTAL_QUESTIONS) {
          setScreen("result");
        } else {
          setScenario(generateScenario());
        }
        return next;
      });
    }, 1200);
  };

  const resetGame = () => {
    clearPending();
    setScreen("start");
    setScenario(null);
    setFeedback("none");
    setProblemLocked(false);
  };

  const resultMessage = (): ReactNode => {
    if (score === TOTAL_QUESTIONS) {
      return (
        <>
          ¡Perfecto! <br />
          <span className="text-sm text-cyan-400">
            Tu memoria funciona mejor que una TPU.
          </span>
        </>
      );
    }
    if (score >= 7) {
      return (
        <>
          ¡Muy bien! <br />
          <span className="text-sm text-green-400">
            Dominas la lógica secuencial.
          </span>
        </>
      );
    }
    if (score >= 4) {
      return (
        <>
          Vas por buen camino. <br />
          <span className="text-sm text-yellow-400">
            Repasa las tablas de verdad del JK y el T.
          </span>
        </>
      );
    }
    return (
      <>
        Necesitas sincronización. <br />
        <span className="text-sm text-red-400">
          Vuelve a revisar la teoría de Flip-Flops.
        </span>
      </>
    );
  };

  const problemAreaClass =
    "p-8 flex-grow flex flex-col items-center justify-center border-2 border-transparent transition-colors duration-300 rounded-b-2xl " +
    (feedback === "correct"
      ? "correct-anim"
      : feedback === "wrong"
        ? "wrong-anim"
        : "") +
    (problemLocked ? " pointer-events-none" : "");

  return (
    <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-slate-900 p-6 border-b border-slate-700 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          FLIP-FLOP ARENA
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Modo práctica (un jugador) · IAD-2427
        </p>
      </div>

      {screen === "start" && (
        <div className="p-8 text-center flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            ¿Podrás predecir la memoria?
          </h2>
          <p className="text-slate-300 mb-8 max-w-md">
            Se te presentará un escenario con un tipo de Flip-Flop, su estado
            actual y sus entradas. Debes decidir cuál será el{" "}
            <strong>nuevo estado (Q)</strong> después de recibir el pulso de
            reloj.
          </p>
          <div className="grid grid-cols-2 gap-4 mb-8 text-sm text-slate-400 text-left w-full max-w-md bg-slate-900 p-4 rounded-lg border border-slate-700">
            <div>
              <span className="text-cyan-400 font-bold">D:</span> Copia el dato
            </div>
            <div>
              <span className="text-green-400 font-bold">T:</span> Alterna si es
              1
            </div>
            <div>
              <span className="text-yellow-400 font-bold">SR:</span> Set(1),
              Reset(0)
            </div>
            <div>
              <span className="text-purple-400 font-bold">JK:</span> Evolución
              del SR
            </div>
          </div>
          <button
            type="button"
            onClick={startGame}
            className="px-8 py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(8,145,178,0.5)] hover:shadow-[0_0_25px_rgba(8,145,178,0.8)] transform hover:-translate-y-1"
          >
            INICIAR RETO
          </button>
        </div>
      )}

      {screen === "game" && scenario && (
        <div className="flex flex-col h-full">
          <div className="flex justify-between items-center p-4 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase text-xs font-bold tracking-wider">
                Pregunta
              </span>
              <span className="mono text-xl font-bold text-white">
                {currentQuestion}/{TOTAL_QUESTIONS}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase text-xs font-bold tracking-wider">
                Aciertos
              </span>
              <span className="mono text-2xl font-bold text-cyan-400">
                {score}
              </span>
            </div>
          </div>

          <div id="problem-area" className={problemAreaClass}>
            <FlipFlopProblem
              scenario={scenario}
              feedback={feedback}
              correctAnswer={scenario.answer}
            />

            <div className="mt-8 text-center">
              <p className="text-lg font-medium text-slate-200 mb-6">
                ¿Cuál será el nuevo estado Q tras el pulso de reloj?
              </p>
              <div className="flex justify-center gap-6">
                <button
                  type="button"
                  onClick={() => checkAnswer(0)}
                  className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-600 hover:border-cyan-400 hover:bg-slate-700 transition-all text-4xl mono font-bold text-white shadow-lg hover:shadow-cyan-500/20"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => checkAnswer(1)}
                  className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-600 hover:border-cyan-400 hover:bg-slate-700 transition-all text-4xl mono font-bold text-white shadow-lg hover:shadow-cyan-500/20"
                >
                  1
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className="p-10 text-center flex flex-col items-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Simulación Completada
          </h2>
          <p className="text-slate-400 mb-8">Análisis de rendimiento lógico</p>

          <div className="bg-slate-900 w-full max-w-sm rounded-2xl p-8 border border-slate-700 shadow-xl mb-8">
            <p className="text-sm text-slate-400 uppercase tracking-widest font-bold mb-2">
              Aciertos
            </p>
            <div className="text-6xl mono font-black text-cyan-400 mb-4">
              {score}/{TOTAL_QUESTIONS}
            </div>
            <p className="text-lg font-medium text-slate-200">
              {resultMessage()}
            </p>
          </div>

          <button
            type="button"
            onClick={resetGame}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-lg transition-all border border-slate-500"
          >
            Volver a Intentar
          </button>
        </div>
      )}
    </div>
  );
}
