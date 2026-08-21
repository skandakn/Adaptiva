import { featuredLesson } from "@/lib/demo-data";
import type { AccessibilitySupport, MindMapNode } from "@/lib/types";

const delay = (ms = 360) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const aiRuntime = {
  provider: process.env.OPENAI_API_KEY ? "external-ready" : "demo-mode",
  demoMode: !process.env.OPENAI_API_KEY
};

export async function simplifyText(input: string, level: "simple" | "very-simple" | "new") {
  await delay();
  if (level === "very-simple") {
    return featuredLesson.verySimple;
  }
  if (level === "new") {
    return `${featuredLesson.verySimple}\n\nExample: imagine copying one page from a book by using the old page as your guide.`;
  }
  return input.length > 40 ? featuredLesson.simplified : input;
}

export async function summarizeContent(input: string) {
  await delay();
  return `Main idea: ${input.slice(0, 92)}... The concept becomes easier when it is split into one action at a time.`;
}

export async function explainStepByStep() {
  await delay();
  return featuredLesson.stepByStep;
}

export async function generateMindMap(): Promise<MindMapNode> {
  await delay();
  return featuredLesson.mindMap;
}

export async function generateQuiz() {
  await delay();
  return featuredLesson.quiz;
}

export async function translateContent(language: "English" | "Kannada" | "Hindi") {
  await delay();
  if (language === "Kannada") {
    return "DNA replication andre cell divide aguva modalu DNA copy maduva prakriye. DNA zipper tara tereyutte, nantara hosa matching side build agutte.";
  }
  if (language === "Hindi") {
    return "DNA replication mein cell divide hone se pehle apne DNA ki copy banata hai. DNA zipper ki tarah khulta hai aur nayi matching strand banti hai.";
  }
  return featuredLesson.simplified;
}

export async function extractConcepts() {
  await delay();
  return featuredLesson.keyConcepts;
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
