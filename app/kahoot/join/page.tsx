"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { LanMultiplayerHint } from "@/components/LanMultiplayerHint";

const PLAYER_KEY = (code: string) => `flipflop_kahoot_player_${code}`;

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefCode = (searchParams.get("code") ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "");

  const [code, setCode] = useState(prefCode);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const c = code.trim().toUpperCase();
    if (c.length < 4) {
      setError("Introduce un código de sala válido");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/sessions/${c}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Jugador" }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error((j as { error?: string }).error ?? "Error");
      const token = (j as { playerToken: string }).playerToken;
      localStorage.setItem(PLAYER_KEY(c), token);
      router.push(`/kahoot/play/${c}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-8"
    >
      <LanMultiplayerHint joinPath="/kahoot/join" className="mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">Unirse a la sala</h1>
      <p className="text-slate-400 text-sm mb-6">
        Introduce el código que muestra el anfitrión y tu nombre.
      </p>
      <label className="block mb-4">
        <span className="text-slate-300 text-sm font-medium">Código</span>
        <input
          type="text"
          value={code}
          onChange={(e) =>
            setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
          }
          maxLength={8}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-white mono tracking-widest text-lg"
          placeholder="ABC123"
          autoComplete="off"
        />
      </label>
      <label className="block mb-6">
        <span className="text-slate-300 text-sm font-medium">Tu nombre</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          className="mt-1 w-full rounded-lg bg-slate-900 border border-slate-600 px-3 py-2 text-white"
          placeholder="Nombre visible en la clasificación"
        />
      </label>
      {error && (
        <p className="text-red-400 text-sm mb-4" role="alert">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-xl font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white"
      >
        {loading ? "Entrando…" : "Entrar"}
      </button>
      <p className="mt-6 text-center">
        <Link href="/" className="text-cyan-400 hover:underline text-sm">
          ← Inicio
        </Link>
      </p>
    </form>
  );
}

export default function KahootJoinPage() {
  return (
    <Suspense
      fallback={
        <div className="text-slate-400 p-8">Cargando formulario…</div>
      }
    >
      <JoinForm />
    </Suspense>
  );
}
