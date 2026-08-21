import { fallbackTranslateBatch } from "@/lib/i18n/fallback-translations";
import type { ContentLanguage } from "@/lib/types";

type TranslationProvider = "openai" | "demo";

type OpenAITranslationResponse = {
  translations?: Array<{
    source?: string;
    target?: string;
  }>;
};

const delay = (ms = 180) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function uniqueTexts(texts: string[]) {
  return Array.from(new Set(texts.map((text) => text.trim()).filter(Boolean))).slice(0, 120);
}

function parseJson(raw: string): OpenAITranslationResponse | null {
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    return JSON.parse(cleaned) as OpenAITranslationResponse;
  } catch {
    return null;
  }
}

async function translateWithOpenAI(language: ContentLanguage, texts: string[]) {
  if (!process.env.OPENAI_API_KEY || (process.env.AI_PROVIDER ?? "openai") !== "openai") return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Translate Adaptiva UI text for an educational accessibility web app. Preserve product names, acronyms, numbers, URLs, and code-like tokens. Return only JSON with this exact shape: {\"translations\":[{\"source\":\"original\",\"target\":\"translation\"}]}. Do not add commentary."
          },
          {
            role: "user",
            content: JSON.stringify({ targetLanguage: language, texts })
          }
        ]
      })
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { output_text?: string };
    const parsed = parseJson(data.output_text ?? "");
    if (!parsed?.translations?.length) return null;

    return Object.fromEntries(
      parsed.translations
        .filter((item): item is { source: string; target: string } => Boolean(item.source && item.target))
        .map((item) => [item.source, item.target])
    );
  } catch {
    return null;
  }
}

export async function translateUiStrings(language: ContentLanguage, texts: string[]) {
  const unique = uniqueTexts(texts);
  if (language === "English") {
    return {
      provider: "demo" as TranslationProvider,
      translations: Object.fromEntries(unique.map((text) => [text, text]))
    };
  }

  const fallback = fallbackTranslateBatch(language, unique);
  const aiTranslations = await translateWithOpenAI(language, unique);
  if (!aiTranslations) {
    await delay();
    return { provider: "demo" as TranslationProvider, translations: fallback };
  }

  const translations = Object.fromEntries(unique.map((text) => [text, aiTranslations[text] ?? fallback[text] ?? text]));
  return { provider: "openai" as TranslationProvider, translations };
}
