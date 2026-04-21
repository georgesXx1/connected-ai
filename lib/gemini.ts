import { GoogleGenAI } from "@google/genai";
import OpenAI from "openai";

export type GeminiClient = {
  ai: GoogleGenAI;
  label: string;
};

export type NvidiaClient = {
  client: OpenAI;
  label: string;
};

export function getGeminiClients() {
  const rawKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_FALLBACK,
    process.env.GEMINI_API_KEY_2,
  ];
  const keys = [...new Set(rawKeys.map((key) => key?.trim()).filter(Boolean))];

  return keys.map((apiKey, index) => ({
    ai: new GoogleGenAI({ apiKey }),
    label: index === 0 ? "primary" : `fallback_${index}`,
  })) satisfies GeminiClient[];
}

export function getNvidiaClient() {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  return {
    client: new OpenAI({
      baseURL: "https://integrate.api.nvidia.com/v1",
      apiKey,
    }),
    label: "nvidia",
  } satisfies NvidiaClient;
}

export async function generateNvidiaText(
  nvidia: NvidiaClient,
  prompt: string,
  options?: {
    temperature?: number;
    topP?: number;
    json?: boolean;
  },
) {
  const completion = await nvidia.client.chat.completions.create({
    model: "z-ai/glm4.7",
    messages: [{ role: "user", content: prompt }],
    temperature: options?.temperature ?? 0.4,
    top_p: options?.topP ?? 0.85,
    max_tokens: 16384,
  });

  const content = completion.choices[0]?.message?.content;
  const text = Array.isArray(content)
    ? content
        .map((part) => ("text" in part ? part.text : ""))
        .join("")
        .trim()
    : (content ?? "").trim();

  if (!text) {
    throw new Error("nvidia/z-ai/glm4.7: empty response");
  }

  if (!options?.json) {
    return text;
  }

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  return jsonMatch?.[0] ?? text;
}
