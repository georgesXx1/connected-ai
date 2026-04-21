import { NextResponse } from "next/server";

import { readAdminContent } from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const content = await readAdminContent();

  return NextResponse.json(
    {
      publicInfo: content.publicInfo,
      gradeInfo: content.gradeInfo,
      updatedAt: content.updatedAt,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
