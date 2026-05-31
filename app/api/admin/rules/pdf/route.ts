import { NextResponse } from "next/server";

import { getAdminSessionUser } from "@/lib/admin-auth";
import { getGeminiClients } from "@/lib/gemini";

export const runtime = "nodejs";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return Buffer.from(buffer).toString("base64");
}

export async function POST(request: Request) {
  const username = await getAdminSessionUser();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  const language = String(formData.get("language") || "en");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "A PDF file is required." }, { status: 400 });
  }

  const clients = getGeminiClients();

  if (clients.length === 0) {
    return NextResponse.json(
      { error: "The AI PDF reader key is missing. Add GEMINI_API_KEY first." },
      { status: 503 },
    );
  }

  const prompt = `
Read this school-rules PDF and extract the rules as plain text for an administrator.

Return only the extracted rule content, grouped by topic if possible.
Do not invent rules.
Do not save or change anything.
The administrator will review the extracted text before publishing.
Preferred explanation language: ${language}
  `.trim();

  try {
    const response = await clients[0].ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: file.type || "application/pdf",
                data: arrayBufferToBase64(await file.arrayBuffer()),
              },
            },
            { text: prompt },
          ],
        },
      ],
    } as never);
    const extractedText =
      typeof response.text === "string" ? response.text.trim() : "";

    if (!extractedText) {
      return NextResponse.json(
        { error: "The AI reader did not return any PDF text." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      extractedText,
      message: "PDF rules were extracted. Review the text before generating an official draft.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "The AI reader could not process the PDF.",
      },
      { status: 503 },
    );
  }
}
