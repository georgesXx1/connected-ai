import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getAdminSessionUser } from "@/lib/admin-auth";
import { type AdminRule, readAdminContent, saveAdminRules } from "@/lib/admin-content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function revalidateRuleSurfaces() {
  revalidatePath("/rules", "page");
  revalidatePath("/student", "page");
  revalidatePath("/administration", "page");
}

function isAdminRuleStatus(value: unknown): value is AdminRule["status"] {
  return value === "draft" || value === "published" || value === "trashed";
}

function isRuleInput(value: unknown): value is Omit<AdminRule, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
} {
  if (!value || typeof value !== "object") {
    return false;
  }

  const rule = value as Partial<AdminRule>;

  return (
    typeof rule.id === "string" &&
    typeof rule.title === "string" &&
    typeof rule.arabicText === "string" &&
    typeof rule.category === "string" &&
    isAdminRuleStatus(rule.status)
  );
}

function normalizeRule(input: Omit<AdminRule, "createdAt" | "updatedAt"> & {
  createdAt?: string;
  updatedAt?: string;
}): AdminRule {
  const now = new Date().toISOString();

  return {
    id: input.id.trim(),
    title: input.title.trim() || "Untitled rule",
    arabicText: input.arabicText.trim(),
    category: input.category.trim() || "General",
    status: input.status,
    createdAt: input.createdAt || now,
    updatedAt: now,
  };
}

function jsonRules(rules: AdminRule[], status = 200) {
  return NextResponse.json({ rules }, { status });
}

async function requireAdmin() {
  const username = await getAdminSessionUser();
  return username;
}

export async function GET() {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized.", rules: [] }, { status: 401 });
  }

  return jsonRules(readAdminContent().rules);
}

export async function POST(request: Request) {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized.", rules: [] }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", rules: [] },
      { status: 400 },
    );
  }

  const rule = (body as { rule?: unknown })?.rule;

  if (!isRuleInput(rule)) {
    return NextResponse.json(
      { error: "Invalid rule payload.", rules: [] },
      { status: 400 },
    );
  }

  const content = readAdminContent();
  const nextRule = normalizeRule(rule);
  const nextRules = [...content.rules, nextRule];
  const savedContent = saveAdminRules(nextRules);

  revalidateRuleSurfaces();
  return jsonRules(savedContent.rules, 201);
}

export async function PUT(request: Request) {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized.", rules: [] }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", rules: [] },
      { status: 400 },
    );
  }

  const rule = (body as { rule?: unknown })?.rule;

  if (!isRuleInput(rule)) {
    return NextResponse.json(
      { error: "Invalid rule payload.", rules: [] },
      { status: 400 },
    );
  }

  const content = readAdminContent();
  const existingRule = content.rules.find((entry) => entry.id === rule.id.trim());

  if (!existingRule) {
    return NextResponse.json(
      { error: "Rule not found.", rules: content.rules },
      { status: 404 },
    );
  }

  const nextRule = normalizeRule({
    ...rule,
    createdAt: existingRule.createdAt,
  });

  const nextRules = content.rules.map((entry) =>
    entry.id === nextRule.id ? nextRule : entry,
  );
  const savedContent = saveAdminRules(nextRules);

  revalidateRuleSurfaces();
  return jsonRules(savedContent.rules);
}

export async function DELETE(request: Request) {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized.", rules: [] }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body.", rules: [] },
      { status: 400 },
    );
  }

  const id =
    typeof (body as { id?: unknown })?.id === "string"
      ? (body as { id: string }).id.trim()
      : "";
  const permanent = Boolean((body as { permanent?: unknown })?.permanent);

  if (!id) {
    return NextResponse.json(
      { error: "Rule id is required.", rules: [] },
      { status: 400 },
    );
  }

  const content = readAdminContent();
  const existingRule = content.rules.find((rule) => rule.id === id);

  if (!existingRule) {
    return NextResponse.json(
      { error: "Rule not found.", rules: content.rules },
      { status: 404 },
    );
  }

  const nextRules = permanent
    ? content.rules.filter((rule) => rule.id !== id)
    : content.rules.map((rule) =>
        rule.id === id
          ? {
              ...rule,
              status: "trashed" as const,
              updatedAt: new Date().toISOString(),
            }
          : rule,
      );

  const savedContent = saveAdminRules(nextRules);
  revalidateRuleSurfaces();
  return jsonRules(savedContent.rules);
}
