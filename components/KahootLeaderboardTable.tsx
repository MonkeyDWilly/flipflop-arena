import type { LeaderboardRow } from "@/lib/sessionStore";

type Props = {
  rows: LeaderboardRow[];
  highlightPlayerId?: string | null;
  /** Mostrar columna de puntos de la última ronda */
  showLastRound?: boolean;
};

export function KahootLeaderboardTable({
  rows,
  highlightPlayerId,
  showLastRound = true,
}: Props) {
  return (
    <div className="w-full max-w-lg mx-auto rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-950/80 text-slate-400 uppercase text-xs tracking-wider">
            <th className="px-4 py-3 w-14">#</th>
            <th className="px-4 py-3">Jugador</th>
            {showLastRound && (
              <th className="px-4 py-3 text-right w-28">Ronda</th>
            )}
            <th className="px-4 py-3 text-right w-24">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const hi = highlightPlayerId === row.playerId;
            return (
              <tr
                key={row.playerId}
                className={
                  "border-b border-slate-800 last:border-0 " +
                  (hi ? "bg-cyan-950/40" : "")
                }
              >
                <td className="px-4 py-3 mono font-bold text-slate-300">
                  {row.rank}
                </td>
                <td className="px-4 py-3 font-medium text-white">{row.name}</td>
                {showLastRound && (
                  <td className="px-4 py-3 text-right mono text-amber-300/90">
                    {row.lastRoundCorrect === null
                      ? "—"
                      : row.lastRoundCorrect
                        ? `+${row.lastRoundPoints}`
                        : "0"}
                  </td>
                )}
                <td className="px-4 py-3 text-right mono font-bold text-cyan-400">
                  {row.totalScore}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
