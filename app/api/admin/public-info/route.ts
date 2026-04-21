import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getAdminSessionUser } from "@/lib/admin-auth";
import {
  type AdminPublicInfo,
  type GradePublicInfo,
  readAdminContent,
  saveAdminPublicInfo,
} from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LocalizedContent = {
  en: string;
  fr: string;
  ar: string;
};

function isLocalizedContent(value: unknown): value is LocalizedContent {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as LocalizedContent).en === "string" &&
    typeof (value as LocalizedContent).fr === "string" &&
    typeof (value as LocalizedContent).ar === "string"
  );
}

function isAdminPublicInfo(value: unknown): value is AdminPublicInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  return Object.values(value as Record<string, unknown>).every((entry) => {
    if (!entry || typeof entry !== "object") {
      return false;
    }

    const candidate = entry as {
      key?: unknown;
      title?: unknown;
      content?: unknown;
      updatedAt?: unknown;
    };

    return (
      typeof candidate.key === "string" &&
      isLocalizedContent(candidate.title) &&
      isLocalizedContent(candidate.content) &&
      typeof candidate.updatedAt === "string"
    );
  });
}

function isGradeInfo(value: unknown): value is GradePublicInfo[] {
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((grade) => {
    if (!grade || typeof grade !== "object") {
      return false;
    }

    const candidate = grade as Partial<GradePublicInfo>;

    return (
      typeof candidate.id === "string" &&
      typeof candidate.className === "string" &&
      (candidate.ageRange === undefined || typeof candidate.ageRange === "string") &&
      typeof candidate.tuitionAmount === "string" &&
      (candidate.tuitionCurrency === "USD" || candidate.tuitionCurrency === "LBP") &&
      typeof candidate.stationeryAmount === "string" &&
      (candidate.stationeryCurrency === "USD" || candidate.stationeryCurrency === "LBP") &&
      typeof candidate.updatedAt === "string" &&
      Array.isArray(candidate.books) &&
      candidate.books.every(
        (book) =>
          !!book &&
          typeof book === "object" &&
          typeof book.id === "string" &&
          typeof book.name === "string" &&
          (book.status === "active" || book.status === "trashed") &&
          typeof book.createdAt === "string" &&
          typeof book.updatedAt === "string",
      )
    );
  });
}

export async function GET() {
  const username = await getAdminSessionUser();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const content = readAdminContent();
  return NextResponse.json({
    publicInfo: content.publicInfo,
    gradeInfo: content.gradeInfo,
  });
}

export async function POST(request: Request) {
  const username = await getAdminSessionUser();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const publicInfo = (body as { publicInfo?: unknown })?.publicInfo;
  const gradeInfo = (body as { gradeInfo?: unknown })?.gradeInfo;

  if (!isAdminPublicInfo(publicInfo)) {
    return NextResponse.json(
      { error: "Invalid public information payload." },
      { status: 400 },
    );
  }

  if (gradeInfo !== undefined && !isGradeInfo(gradeInfo)) {
    return NextResponse.json(
      { error: "Invalid grade information payload." },
      { status: 400 },
    );
  }

  const content = saveAdminPublicInfo(publicInfo, gradeInfo);
  revalidatePath("/", "page");
  revalidatePath("/administration", "page");
  revalidatePath("/guest", "page");
  revalidatePath("/tuition", "page");

  return NextResponse.json({
    publicInfo: content.publicInfo,
    gradeInfo: content.gradeInfo,
    updatedAt: content.updatedAt,
  });
}
