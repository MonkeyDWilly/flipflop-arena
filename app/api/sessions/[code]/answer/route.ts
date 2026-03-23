import { NextResponse } from "next/server";
import { submitAnswer } from "@/lib/sessionStore";

type RouteParams = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteParams) {
  const { code: raw } = await context.params;
  const code = raw.toUpperCase();

  let playerToken = "";
  let choice: 0 | 1 = 0;
  try {
    const body = await request.json();
    if (typeof body.playerToken === "string") playerToken = body.playerToken;
    if (body.choice === 0 || body.choice === 1) choice = body.choice;
    else {
      return NextResponse.json({ error: "choice debe ser 0 o 1" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const result = submitAnswer(code, playerToken, choice);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
