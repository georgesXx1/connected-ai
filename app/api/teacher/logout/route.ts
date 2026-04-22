import { NextResponse } from "next/server";

import { clearTeacherSession } from "@/lib/teacher-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  return clearTeacherSession(NextResponse.json({ ok: true }));
}
