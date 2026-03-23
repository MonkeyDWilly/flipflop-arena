import Link from "next/link";

export default function HomePage() {
  return (
    <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
      <div className="bg-slate-900 p-6 border-b border-slate-700 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-blue-500" />
        <h1 className="text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
          FLIP-FLOP ARENA
        </h1>
        <p className="text-slate-400 mt-2 text-sm">
          Simulador de Lógica Secuencial | IAD-2427
        </p>
      </div>

      <div className="p-8 flex flex-col gap-4">
        <p className="text-slate-300 text-center mb-2">
          Elige cómo quieres jugar: multijugador tipo Kahoot con temporizador y
          puntuación por rapidez, o práctica en solitario.
        </p>

        <Link
          href="/kahoot/host"
          className="block w-full text-center px-6 py-4 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 text-white transition-all shadow-[0_0_15px_rgba(8,145,178,0.35)]"
        >
          Crear sala (anfitrión)
        </Link>

        <Link
          href="/kahoot/join"
          className="block w-full text-center px-6 py-4 rounded-xl font-bold bg-slate-700 hover:bg-slate-600 text-white border border-slate-500 transition-all"
        >
          Unirse con código
        </Link>

        <Link
          href="/solo"
          className="block w-full text-center px-6 py-4 rounded-xl font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-600 transition-all"
        >
          Modo práctica (un jugador)
        </Link>
      </div>
    </div>
  );
}
