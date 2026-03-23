import { NextResponse } from "next/server";
import {
  createSession,
  DEFAULT_TIME_LIMIT_SEC,
  DEFAULT_TOTAL_QUESTIONS,
} from "@/lib/sessionStore";

export async function POST(request: Request) {
  let body: { timeLimitSec?: number; totalQuestions?: number } = {};
  try {
    body = await request.json();
  } catch {
    /* vacío → defaults */
  }

  const { code, hostSecret } = createSession({
    timeLimitSec: body.timeLimitSec ?? DEFAULT_TIME_LIMIT_SEC,
    totalQuestions: body.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS,
  });

  return NextResponse.json({
    code,
    hostToken: hostSecret,
    defaults: {
      timeLimitSec: body.timeLimitSec ?? DEFAULT_TIME_LIMIT_SEC,
      totalQuestions: body.totalQuestions ?? DEFAULT_TOTAL_QUESTIONS,
    },
  });
}
