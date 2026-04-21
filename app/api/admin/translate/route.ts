import { NextResponse } from "next/server";

import { getAdminSessionUser } from "@/lib/admin-auth";
import { generateNvidiaText, getGeminiClients, getNvidiaClient } from "@/lib/gemini";

export const runtime = "nodejs";

type Language = "en" | "fr" | "ar";

type TranslationPayload = {
  translations: Record<Language, string>;
  note?: string;
};

function isLanguage(value: unknown): value is Language {
  return value === "en" || value === "fr" || value === "ar";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function extractJsonPayload(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function emptyTranslations(sourceLanguage: Language, text: string): TranslationPayload {
  return {
    translations: {
      en: sourceLanguage === "en" ? text : "",
      fr: sourceLanguage === "fr" ? text : "",
      ar: sourceLanguage === "ar" ? text : "",
    },
  };
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

  const sourceLanguage = isLanguage((body as { sourceLanguage?: unknown })?.sourceLanguage)
    ? ((body as { sourceLanguage: Language }).sourceLanguage as Language)
    : null;
  const text = normalizeText((body as { text?: unknown })?.text);
  const sectionTitle = normalizeText((body as { sectionTitle?: unknown })?.sectionTitle);

  if (!sourceLanguage || !text) {
    return NextResponse.json(
      { error: "Source language and text are required." },
      { status: 400 },
    );
  }

  const geminiClients = getGeminiClients();

  if (geminiClients.length === 0) {
    return NextResponse.json(
      {
        ...emptyTranslations(sourceLanguage, text),
        note: "AI key missing, so only the source language was kept.",
      },
      { status: 200 },
    );
  }

  const prompt = `
You translate official school administration content.

Task:
- Translate the provided school public-information text into English, French, and Arabic.
- Keep the tone formal, clear, and public-facing.
- Preserve names, phone numbers, email addresses, and factual details.
- Return plain text translations only.
- Do not add information that does not appear in the source.

Section: ${sectionTitle || "Public information"}
Source language: ${sourceLanguage}

Return strict JSON only in this shape:
{
  "en": "English translation",
  "fr": "French translation",
  "ar": "Arabic translation"
}

Source text:
${text}
  `.trim();

  try {
    const errors: string[] = [];
    let raw = "";

    for (const client of geminiClients) {
      try {
        const response = await client.ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            temperature: 0.2,
            topP: 0.8,
            responseMimeType: "application/json",
          },
        });

        raw = typeof response.text === "string" ? response.text.trim() : "";

        if (raw) {
          break;
        }

        errors.push(`${client.label}/gemini-2.5-flash: empty response`);
      } catch (error) {
        errors.push(`${client.label}/gemini-2.5-flash: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!raw) {
      const nvidia = getNvidiaClient();

      if (nvidia) {
        try {
          raw = await generateNvidiaText(nvidia, prompt, {
            temperature: 0.2,
            topP: 0.8,
            json: true,
          });
        } catch (error) {
          errors.push(`${nvidia.label}/z-ai/glm4.7: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    if (!raw) {
      return NextResponse.json(
        {
          ...emptyTranslations(sourceLanguage, text),
          note: errors.length
            ? `The translation assistant returned an empty result: ${errors.join(" | ")}`
            : "The translation assistant returned an empty result.",
        },
        { status: 502 },
      );
    }

    const parsed = JSON.parse(extractJsonPayload(raw)) as Partial<Record<Language, string>>;

    if (!parsed.en || !parsed.fr || !parsed.ar) {
      return NextResponse.json(
        {
          ...emptyTranslations(sourceLanguage, text),
          note: "The translation assistant returned an incomplete result.",
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      translations: {
        en: parsed.en.trim(),
        fr: parsed.fr.trim(),
        ar: parsed.ar.trim(),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return NextResponse.json(
      {
        ...emptyTranslations(sourceLanguage, text),
        note: `Translation assistant failed: ${message}`,
      },
      { status: 502 },
    );
  }
}
