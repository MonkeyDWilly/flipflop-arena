import { NextResponse } from "next/server";
import { buildHostResponse, buildPlayerResponse } from "@/lib/sessionApi";
import { getSessionAndTick } from "@/lib/sessionStore";

type RouteParams = { params: Promise<{ code: string }> };

export async function GET(request: Request, context: RouteParams) {
  const { code: raw } = await context.params;
  const code = raw.toUpperCase();
  const { searchParams } = new URL(request.url);
  const hostToken = searchParams.get("hostToken");
  const playerToken = searchParams.get("playerToken");

  const session = getSessionAndTick(code);
  if (!session) {
    return NextResponse.json({ error: "Sala no encontrada" }, { status: 404 });
  }

  if (hostToken && hostToken === session.hostSecret) {
    return NextResponse.json(buildHostResponse(session));
  }

  if (playerToken) {
    const player = [...session.players.values()].find(
      (p) => p.token === playerToken,
    );
    if (!player) {
      return NextResponse.json({ error: "Sesión de jugador inválida" }, { status: 403 });
    }
    return NextResponse.json(buildPlayerResponse(session, player));
  }

  return NextResponse.json({ error: "Falta hostToken o playerToken" }, { status: 401 });
}
