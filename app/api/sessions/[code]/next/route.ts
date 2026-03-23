import { NextResponse } from "next/server";
import { hostAdvance } from "@/lib/sessionStore";

type RouteParams = { params: Promise<{ code: string }> };

export async function POST(request: Request, context: RouteParams) {
  const { code: raw } = await context.params;
  const code = raw.toUpperCase();

  const hostToken = request.headers.get("x-host-token");
  if (!hostToken) {
    return NextResponse.json({ error: "Falta x-host-token" }, { status: 401 });
  }

  const result = hostAdvance(code, hostToken);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
