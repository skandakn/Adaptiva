import { featuredLesson, mindMapsByLanguage } from "@/lib/demo-data";
import type { AccessibilitySupport, ContentLanguage, MindMapNode } from "@/lib/types";

type Level = "simple" | "very-simple" | "new";

const delay = (ms = 360) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const aiRuntime = {
  provider: process.env.OPENAI_API_KEY ? process.env.AI_PROVIDER ?? "openai" : "demo-mode",
  demoMode: !process.env.OPENAI_API_KEY
};

async function callOpenAI(instructions: string, input: string, fallback: string) {
  if (!process.env.OPENAI_API_KEY || (process.env.AI_PROVIDER ?? "openai") !== "openai") {
    await delay();
    return fallback;
  }

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
            content: instructions
          },
          {
            role: "user",
            content: input
          }
        ]
      })
    });

    if (!response.ok) {
      return fallback;
    }

    const data = (await response.json()) as { output_text?: string };
    return data.output_text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

export async function simplifyText(input: string, level: Level) {
  const fallback =
    level === "very-simple"
      ? featuredLesson.verySimple
      : level === "new"
        ? `${featuredLesson.verySimple}\n\nExample: imagine copying one page from a book by using the old page as your guide.`
        : input.length > 40
          ? featuredLesson.simplified
          : input;

  return callOpenAI(
    "Rewrite educational content in accessible plain language. Preserve meaning and avoid medicalized language.",
    `Level: ${level}\n\n${input}`,
    fallback
  );
}

export async function summarizeContent(input: string) {
  return callOpenAI(
    "Summarize educational content for a learner who benefits from low cognitive load. Use short, clear sentences.",
    input,
    `Main idea: ${input.slice(0, 92)}... The concept becomes easier when it is split into one action at a time.`
  );
}

export async function explainStepByStep(input = featuredLesson.original) {
  const fallback = featuredLesson.stepByStep.join("\n");
  const result = await callOpenAI(
    "Break the concept into numbered sequential learning steps. One idea per step.",
    input,
    fallback
  );
  return result
    .split(/\n+/)
    .map((line) => line.replace(/^Step\s*\d+[:.)-]?\s*/i, "").trim())
    .filter(Boolean);
}

export async function generateMindMap(
  input = featuredLesson.original,
  language: ContentLanguage = "English"
): Promise<MindMapNode> {
  const fallback = mindMapsByLanguage[language] ?? featuredLesson.mindMap;
  if (!process.env.OPENAI_API_KEY) {
    await delay();
    return fallback;
  }
  const result = await callOpenAI(
    `Create a compact educational concept map. Return ONLY valid JSON with this shape:
{"id":"root","label":"topic","children":[{"id":"b1","label":"branch","children":[{"id":"l1","label":"leaf"}]}]}
Rules:
- Write every label in ${language}
- Keep the same branching structure for any language (one root, 2-4 branches, each with 1-3 children)
- Labels must be short (under 40 characters)
- No markdown fences`,
    input,
    ""
  );
  const parsed = parseMindMapJson(result);
  return parsed ?? fallback;
}

function parseMindMapJson(raw: string): MindMapNode | null {
  if (!raw) return null;
  try {
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as MindMapNode;
    if (!parsed?.id || !parsed?.label) return null;
    return parsed;
  } catch {
    return null;
  }
}

function collectLabels(node: MindMapNode): { id: string; label: string }[] {
  return [{ id: node.id, label: node.label }, ...(node.children?.flatMap(collectLabels) ?? [])];
}

function applyTranslatedLabels(node: MindMapNode, labels: Record<string, string>): MindMapNode {
  return {
    ...node,
    label: labels[node.id] ?? node.label,
    children: node.children?.map((child) => applyTranslatedLabels(child, labels))
  };
}

export async function translateMindMap(language: ContentLanguage, node: MindMapNode): Promise<MindMapNode> {
  const demoIds = new Set(collectLabels(featuredLesson.mindMap).map((item) => item.id));
  const incomingIds = collectLabels(node).map((item) => item.id);
  const isDemoTree = incomingIds.length === demoIds.size && incomingIds.every((id) => demoIds.has(id));
  if (isDemoTree) {
    await delay();
    return mindMapsByLanguage[language];
  }

  const labels = collectLabels(node);
  const result = await callOpenAI(
    `Translate each mind-map label into ${language}. Keep scientific terms readable for learners.
Return ONLY JSON: {"id":"translated label", ...} using the same ids.
Do not change the number of nodes or invent new ids.`,
    JSON.stringify(Object.fromEntries(labels.map((item) => [item.id, item.label]))),
    ""
  );

  if (!result) return isDemoTree ? mindMapsByLanguage[language] : node;
  try {
    const cleaned = result.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const map = JSON.parse(cleaned) as Record<string, string>;
    return applyTranslatedLabels(node, map);
  } catch {
    return node;
  }
}

export async function generateQuiz(input = featuredLesson.original) {
  const fallback = featuredLesson.quiz;
  const result = await callOpenAI(
    "Create three accessible quiz questions and answers from the learning content.",
    input,
    ""
  );
  if (!result) return fallback;
  return result
    .split(/\n\n+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((block) => ({ question: block.split("\n")[0] ?? block, answer: block.split("\n").slice(1).join(" ") || "Review the concept in the adapted lesson." }));
}

export async function translateContent(language: ContentLanguage, input = featuredLesson.simplified) {
  if (language === "English") {
    return callOpenAI(`Keep the content in English. Clarify wording without adding new facts.`, input, input);
  }

  const demoFallback =
    language === "Kannada"
      ? "ಡಿಎನ್‌ಎ ಪ್ರತಿಕೃತಿ ಎಂದರೆ ಕೋಶ ವಿಭಜನೆಯಾಗುವ ಮೊದಲು ಡಿಎನ್‌ಎಯ ಒಂದು ಪ್ರತಿಯನ್ನು ತಯಾರಿಸುವ ಪ್ರಕ್ರಿಯೆ. ಡಿಎನ್‌ಎ ಜಿಪ್ಪರ್‌ನಂತೆ ತೆರೆಯುತ್ತದೆ, ನಂತರ ಹೊಸ ಹೊಂದಾಣಿಕೆಯ ಸರಪಳಿಗಳು ನಿರ್ಮಾಣವಾಗುತ್ತವೆ."
      : "डीएनए प्रतिकृति वह प्रक्रिया है जिसमें कोशिका विभाजन से पहले डीएनए की एक प्रति बनाती है। डीएनए ज़िप की तरह खुलता है और फिर नई मिलान वाली श्रृंखलाएँ बनती हैं।";

  const usesDemoLesson =
    input.includes("DNA replication") ||
    input.includes("DNA Replication") ||
    input === featuredLesson.simplified ||
    input === featuredLesson.original;

  return callOpenAI(
    `Translate the educational content into ${language}. Keep scientific terms clear for a learner. Preserve paragraph and line breaks. Do not add new facts.`,
    input,
    usesDemoLesson ? demoFallback : input
  );
}

export async function extractConcepts(input = featuredLesson.original) {
  const result = await callOpenAI(
    "Extract the most important learning concepts as a short newline-separated list.",
    input,
    featuredLesson.keyConcepts.join("\n")
  );
  return result
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 8);
}

export async function askTutor(input: string, question?: string) {
  return callOpenAI(
    "Answer as Adaptiva, an accessibility-first learning assistant. Use respectful, simple, context-aware explanations.",
    `Content:\n${input}\n\nQuestion:\n${question ?? "Explain this differently."}`,
    "Think of DNA as a recipe book. Before a cell divides, it needs a second copy. DNA opens, each half guides a matching new half, and the cell ends with two complete copies."
  );
}

export async function analyzeAccessibilityNeeds(preferences: AccessibilitySupport[]) {
  await delay();
  return {
    reading: preferences.includes("Dyslexia-friendly reading") ? "High readability" : "Standard",
    focus: preferences.includes("Focus support") ? "Minimal distraction" : "Guided",
    explanation: preferences.includes("Step-by-step learning") ? "Step-by-step" : "Simple",
    audio: preferences.includes("Audio learning") ? "Enabled" : "Optional",
    language: preferences.includes("Translation support") ? "English + translation-ready" : "English"
  };
}
