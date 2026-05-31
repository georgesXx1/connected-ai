import { NextResponse } from "next/server";

import {
  mergeServerPortalData,
  readServerPortalData,
  writeServerPortalData,
  type ServerPortalData,
} from "@/lib/portal/server-store";

export async function GET() {
  const data = await readServerPortalData();
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const data = (await request.json().catch(() => null)) as ServerPortalData | null;

  if (!data || !Array.isArray(data.users)) {
    return NextResponse.json({ message: "Invalid portal data." }, { status: 400 });
  }

  const serverData = await readServerPortalData();
  await writeServerPortalData(mergeServerPortalData(serverData, data));
  return NextResponse.json({ ok: true });
}
