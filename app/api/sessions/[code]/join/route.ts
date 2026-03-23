import { NextResponse } from "next/server";
import { joinSession } from "@/lib/sessionStore";

type RouteParams = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteParams) {
  const { code: raw } = await context.params;
  const code = raw.toUpperCase();

  let name = "Jugador";
  try {
    const body = await request.json();
    if (typeof body.name === "string") name = body.name;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const result = joinSession(code, name);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    playerToken: result.playerToken,
    playerId: result.playerId,
  });
}
