import { auth } from "@/auth";
import { type NextRequest, NextResponse } from "next/server";
import {
  savePuterSession,
  validatePuterToken,
  invalidatePuterSession,
  getPuterSessionInfo,
} from "@/lib/ai/puter-client";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const info = await getPuterSessionInfo(session.user.id);

  return NextResponse.json({
    success: true,
    data: {
      auto_mode: process.env.PUTER_GET_AUTO_TOKEN_FROM_LOGGED_USER === "true",
      ...info,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    token: string;
    username?: string;
    uuid?: string;
    app_uid?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  // Validasi token ke Puter API sebelum menyimpan
  const puterUser = await validatePuterToken(body.token);
  if (!puterUser) {
    return NextResponse.json(
      { error: "Token Puter is not valid." },
      { status: 401 }
    );
  }

  // Simpan ke DB
  await savePuterSession({
    userId: session.user.id,
    token: body.token,
    puter_username: puterUser.username ?? body.username,
    puter_uid: puterUser.uuid ?? body.uuid,
    app_uid: body.app_uid,
  });

  return NextResponse.json({
    success: true,
    data: {
      connected: true,
      puter_username: puterUser.username,
      puter_uid: puterUser.uuid,
    },
  });
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await invalidatePuterSession(session.user.id);

  return NextResponse.json({
    success: true,
    message: "Puter connection successfully disconnected.",
  });
}
