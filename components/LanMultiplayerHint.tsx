"use client";

import { useEffect, useState } from "react";

/**
 * En desarrollo, si el anfitrión abre la app con localhost, los demás dispositivos
 * deben usar la IP LAN del PC; localhost en el móvil apunta al propio móvil.
 */
export function LanMultiplayerHint({
  joinPath,
  className = "",
}: {
  joinPath: string;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [port, setPort] = useState("3000");

  useEffect(() => {
    const h = window.location.hostname;
    setVisible(h === "localhost" || h === "127.0.0.1");
    const p = window.location.port;
    if (p) setPort(p);
  }, []);

  if (!visible) return null;

  return (
    <div
      className={
        "rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100/95 " +
        className
      }
    >
      <p className="font-semibold text-amber-200 mb-1">
        Misma WiFi, otro dispositivo
      </p>
      <p className="text-amber-100/85 mb-2">
        En el segundo aparato <strong>no uses</strong>{" "}
        <span className="font-mono text-white">localhost</span>: ahí se refiere
        a ese dispositivo, no al PC donde corre el servidor. Abre la app usando
        la <strong>IPv4 de este ordenador</strong> (en Windows: terminal →{" "}
        <span className="font-mono">ipconfig</span>).
      </p>
      <p className="text-amber-100/85">
        Ejemplo de URL en el móvil u otro PC:{" "}
        <span className="break-all font-mono text-cyan-300/95">
          http://192.168.x.x:{port}
          {joinPath.startsWith("/") ? joinPath : `/${joinPath}`}
        </span>
      </p>
    </div>
  );
}
