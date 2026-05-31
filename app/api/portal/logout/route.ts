import { NextResponse } from "next/server";

import { clearPortalSession } from "@/lib/portal/auth";

function redirectHome(request: Request) {
  return clearPortalSession(NextResponse.redirect(new URL("/", request.url), 303));
}

export async function POST(request: Request) {
  return redirectHome(request);
}

export async function GET(request: Request) {
  return redirectHome(request);
}
