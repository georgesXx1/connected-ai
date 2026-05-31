import { NextResponse } from "next/server";

import { clearPortalSession } from "@/lib/portal/auth";

export async function POST(request: Request) {
  return clearPortalSession(NextResponse.redirect(new URL("/", request.url)));
}
