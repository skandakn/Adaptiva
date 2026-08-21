import { featuredLesson } from "@/lib/demo-data";
import type { AccessibilitySupport, MindMapNode } from "@/lib/types";

type Level = "simple" | "very-simple" | "new";
type Language = "English" | "Kannada" | "Hindi";

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

export async function generateMindMap(input = featuredLesson.original): Promise<MindMapNode> {
  if (!process.env.OPENAI_API_KEY) {
    await delay();
    return featuredLesson.mindMap;
  }
  const result = await callOpenAI(
    "Create a compact text mind map for the educational concept. Return concise branches only.",
    input,
    ""
  );
  return result
    ? {
        id: "ai-map",
        label: "Generated Map",
        children: result
          .split(/\n+/)
          .filter(Boolean)
          .slice(0, 6)
          .map((line, index) => ({ id: `node-${index}`, label: line.replace(/^[-*]\s*/, "") }))
      }
    : featuredLesson.mindMap;
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

export async function translateContent(language: Language, input = featuredLesson.simplified) {
  await delay();
  if (language === "Kannada") {
    return "ಡಿಎನ್‌ಎ ಪ್ರತಿಕೃತಿ ಎಂದರೆ ಕೋಶ ವಿಭಜನೆಯಾಗುವ ಮೊದಲು ಡಿಎನ್‌ಎಯ ಒಂದು ಪ್ರತಿಯನ್ನು ತಯಾರಿಸುವ ಪ್ರಕ್ರಿಯೆ. ಡಿಎನ್‌ಎ ಜಿಪ್ಪರ್‌ನಂತೆ ತೆರೆಯುತ್ತದೆ, ನಂತರ ಹೊಸ ಹೊಂದಾಣಿಕೆಯ ಸರಪಳಿಗಳು ನಿರ್ಮಾಣವಾಗುತ್ತವೆ.";
  }
  if (language === "Hindi") {
    return "डीएनए प्रतिकृति वह प्रक्रिया है जिसमें कोशिका विभाजन से पहले डीएनए की एक प्रति बनाती है। डीएनए ज़िप की तरह खुलता है और फिर नई मिलान वाली श्रृंखलाएँ बनती हैं।";
  }
  return callOpenAI(
    `Translate the content into ${language}. Keep terms clear for a learner.`,
    input,
    input
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
