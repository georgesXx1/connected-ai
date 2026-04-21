import { NextResponse } from "next/server";

import { attachAdminSession, getAdminCredentials } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username =
    typeof (body as { username?: unknown })?.username === "string"
      ? (body as { username: string }).username.trim()
      : "";
  const password =
    typeof (body as { password?: unknown })?.password === "string"
      ? (body as { password: string }).password
      : "";

  const credentials = getAdminCredentials();

  if (username !== credentials.username || password !== credentials.password) {
    return NextResponse.json(
      { error: "Invalid administrator credentials." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ ok: true, username });
  return attachAdminSession(response, username);
}
