import { featuredLesson, mindMapsByLanguage } from "@/lib/demo-data";
import type { AccessibilitySupport, ContentLanguage, MindMapNode } from "@/lib/types";

type Level = "simple" | "very-simple" | "new";
type ImageAdaptAction = "Simple explanation" | "Example" | "Visual explanation" | "Step-by-step";
export type AdaptivaChatMessage = { role: "user" | "assistant"; content: string };
export type AdaptivaChatContext = Record<string, unknown>;

const delay = (ms = 360) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

export const aiRuntime = {
  provider: process.env.GROQ_API_KEY ? process.env.AI_PROVIDER ?? "groq" : "demo-mode",
  demoMode: !process.env.GROQ_API_KEY
};

async function callOpenAI(instructions: string, input: string, fallback: string) {
  if (!process.env.GROQ_API_KEY) {
    await delay();
    return fallback;
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "openai/gpt-oss-20b",
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

function getResponseOutputText(data: unknown) {
  if (data && typeof data === "object" && "output_text" in data && typeof (data as { output_text?: unknown }).output_text === "string") {
    return (data as { output_text: string }).output_text.trim();
  }

  if (!data || typeof data !== "object" || !("output" in data) || !Array.isArray((data as { output?: unknown }).output)) {
    return "";
  }

  return (data as { output: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }> }).output
    .flatMap((item) => item.content ?? [])
    .map((item) => (typeof item.text === "string" ? item.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

function getLatestUserMessage(messages: AdaptivaChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
}

function getChatFallback(messages: AdaptivaChatMessage[]) {
  const question = getLatestUserMessage(messages);
  return question
    ? "Ask Adaptiva needs the server-side AI connection to answer this directly. Please try again when the AI service is available."
    : "Ask Adaptiva needs a question to answer.";
}

export async function generateNotesFromTranscript(transcript: string) {
  if (!process.env.GROQ_API_KEY) {
    return "";
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "openai/gpt-oss-20b",
        input: [
          {
            role: "system",
            content:
              "You generate clear, structured educational notes from a video transcript. Use only information supported by the transcript. Do not invent facts, examples, definitions, or conclusions that are not present. Organize the notes with a title, key points, and a short summary when the transcript supports them. If the transcript is incomplete, note that and stay within what it actually says."
          },
          {
            role: "user",
            content: `Create educational notes from this transcript:\n\n${transcript}`
          }
        ]
      })
    });

    if (!response.ok) return "";

    const data = await response.json();
    return getResponseOutputText(data);
  } catch {
    return "";
  }
}

export async function askAdaptivaChat(messages: AdaptivaChatMessage[], _context?: AdaptivaChatContext) {
  if (!process.env.GROQ_API_KEY) {
    await delay();
    return getChatFallback(messages);
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "openai/gpt-oss-20b",
        input: [
          {
            role: "system",
            content:
              "You are Ask Adaptiva, a general educational assistant for learners across subjects. When the learner asks a direct educational question, answer the question directly first. For example, if they ask what a concept is, explain that concept; if they ask for a simple explanation, explain it simply; if they ask for an example, include an example. Do not give meta-advice about how to study, how to approach the question, or what information to provide unless the learner explicitly asks for study guidance or planning help. Explain clearly, accurately, and accessibly. When the learner asks for a simpler explanation, step-by-step explanation, examples, summary, important points, quiz, easier wording, study help, or accessibility support, adapt the response to that request. Keep the conversation primarily focused on education and learning support."
          },
          ...messages
        ]
      })
    });

    if (!response.ok) return getChatFallback(messages);

    const data = await response.json();
    return getResponseOutputText(data) || getChatFallback(messages);
  } catch {
    return getChatFallback(messages);
  }
}

function describeImageFallback(action: ImageAdaptAction, filename: string, image: string) {
  const mime = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/)?.[1] ?? "uploaded image";
  const sizeBytes = Math.round(((image.split(",")[1]?.length ?? 0) * 3) / 4);
  const sizeLabel = sizeBytes > 1000000 ? `${(sizeBytes / 1000000).toFixed(1)} MB` : `${Math.max(1, Math.round(sizeBytes / 1000))} KB`;
  const base = `Uploaded image: ${filename}\nType: ${mime}\nApprox. size: ${sizeLabel}`;

  if (action === "Example") {
    return `${base}\n\nExample-based support: describe the visible objects, labels, or handwritten text in this image, then connect each one to a familiar example. Add a Groq API key to generate this from the actual image contents.`;
  }
  if (action === "Visual explanation") {
    return `${base}\n\nVisual support: inspect the image from top to bottom, name the important regions, and explain what each region shows. Add a Groq API key to generate this from the actual image contents.`;
  }
  if (action === "Step-by-step") {
    return `${base}\n\nStep-by-step support:\n1. Look at the title, labels, and main shapes.\n2. Read any scanned text line by line.\n3. Explain each visible part in order.\n\nAdd a Groq API key to generate these steps from the actual image contents.`;
  }

  return `${base}\n\nSimple explanation: this is the uploaded image selected for analysis. Add a Groq API key to generate a simple explanation from the actual visible content.`;
}

async function getGroqErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as { error?: { code?: string; message?: string } };
    if (data.error?.code === "insufficient_quota") {
      return "Groq could not analyze this image because the API key has no available quota. Check your Groq account, then try again.";
    }
    if (data.error?.code === "invalid_api_key") {
      return "Groq could not analyze this image because the API key is invalid. Create a new key, update .env.local, and restart the app.";
    }
    return data.error?.message ?? "Groq could not analyze this image right now.";
  } catch {
    return "Groq could not analyze this image right now.";
  }
}

export async function analyzeUploadedImage(action: ImageAdaptAction, image: string, filename: string) {
  const fallback = describeImageFallback(action, filename, image);
  if (!process.env.GROQ_API_KEY) {
    await delay();
    return fallback;
  }

  const actionInstructions: Record<ImageAdaptAction, string> = {
    "Simple explanation": "Explain the uploaded image or scanned page in simple learner-friendly language. Mention visible text, objects, labels, and the main idea.",
    Example: "Explain the uploaded image or scanned page using one concrete example connected to what is visible.",
    "Visual explanation": "Describe the uploaded image spatially. Move from the most important visible area to supporting details, labels, and relationships.",
    "Step-by-step": "Explain the uploaded image or scanned page as numbered steps. If it contains text, extract the useful text before explaining it."
  };

  try {
    const response = await fetch("https://api.groq.com/openai/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_VISION_MODEL ?? "qwen/qwen3.6-27b",
        input: [
          {
            role: "system",
            content:
              "You are Adaptiva, an accessibility-first learning assistant. Analyze only the uploaded image. If it is a scanned document, extract the important readable text before explaining it."
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `${actionInstructions[action]}\n\nFilename: ${filename}`
              },
              {
                type: "input_image",
                image_url: image
              }
            ]
          }
        ]
      })
    });

    if (!response.ok) return await getGroqErrorMessage(response);
    const data = await response.json();
    return getResponseOutputText(data) || fallback;
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
  if (!process.env.GROQ_API_KEY) {
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

  const demoFallbackByLanguage: Record<Exclude<ContentLanguage, "English">, string> = {
    Kannada:
      "ಡಿಎನ್‌ಎ ಪ್ರತಿಕೃತಿ ಎಂದರೆ ಕೋಶ ವಿಭಜನೆಯಾಗುವ ಮೊದಲು ಡಿಎನ್‌ಎಯ ಒಂದು ಪ್ರತಿಯನ್ನು ತಯಾರಿಸುವ ಪ್ರಕ್ರಿಯೆ. ಡಿಎನ್‌ಎ ಜಿಪ್ಪರ್‌ನಂತೆ ತೆರೆಯುತ್ತದೆ, ನಂತರ ಹೊಸ ಹೊಂದಾಣಿಕೆಯ ಸರಪಳಿಗಳು ನಿರ್ಮಾಣವಾಗುತ್ತವೆ.",
    Hindi:
      "डीएनए प्रतिकृति वह प्रक्रिया है जिसमें कोशिका विभाजन से पहले डीएनए की एक प्रति बनाती है। डीएनए ज़िप की तरह खुलता है और फिर नई मिलान वाली श्रृंखलाएँ बनती हैं।",
    Urdu:
      "ڈی این اے نقل وہ عمل ہے جس میں خلیہ تقسیم سے پہلے اپنے ڈی این اے کی ایک کاپی بناتا ہے۔ ڈی این اے زپ کی طرح کھلتا ہے، پھر نئی ملتی ہوئی زنجیریں بنتی ہیں۔",
    Tamil:
      "DNA நகலெடுப்பு என்பது செல்கள் பிரிவதற்கு முன் DNA-வின் ஒரு பிரதியை உருவாக்கும் செயல்முறை. DNA ஜிப் போல திறக்கிறது; பிறகு பொருந்தும் புதிய இழைகள் உருவாகின்றன."
  };

  const usesDemoLesson =
    input.includes("DNA replication") ||
    input.includes("DNA Replication") ||
    input === featuredLesson.simplified ||
    input === featuredLesson.original;

  return callOpenAI(
    `Translate the educational content into ${language}. Keep scientific terms clear for a learner. Preserve paragraph and line breaks. Do not add new facts.`,
    input,
    usesDemoLesson ? demoFallbackByLanguage[language] : input
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
    language: preferences.includes("Translation support") ? "English, Hindi, Kannada, Urdu, Tamil" : "English"
  };
}
