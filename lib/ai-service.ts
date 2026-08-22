import { featuredLesson, mindMapsByLanguage } from "@/lib/demo-data";
import type { AccessibilitySupport, ContentLanguage, MindMapNode } from "@/lib/types";

type Level = "simple" | "very-simple" | "new";
export type ImageAdaptAction = "Simple explanation" | "Example" | "Visual explanation" | "Step-by-step";
export type AdaptivaChatMessage = { role: "user" | "assistant"; content: string };
export type AdaptivaChatContext = Record<string, unknown>;

const delay = (ms = 360) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

function getAiConfig() {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const groqKey = process.env.GROQ_API_KEY?.trim();
  const apiKey = openaiKey || groqKey;
  const isGroq = !openaiKey && Boolean(groqKey);
  const provider = (process.env.AI_PROVIDER || (openaiKey ? "openai" : groqKey ? "groq" : "demo-mode")).toLowerCase();

  const textModel = isGroq
    ? (process.env.AI_MODEL || "llama-3.3-70b-versatile")
    : (process.env.AI_MODEL && !process.env.AI_MODEL.includes("gpt-oss") ? process.env.AI_MODEL : "gpt-4o-mini");

  const visionModel = isGroq
    ? (process.env.AI_VISION_MODEL && !process.env.AI_VISION_MODEL.includes("qwen") ? process.env.AI_VISION_MODEL : "llama-3.2-11b-vision-preview")
    : (process.env.AI_VISION_MODEL && !process.env.AI_VISION_MODEL.includes("gpt-4.1") && !process.env.AI_VISION_MODEL.includes("qwen")
        ? process.env.AI_VISION_MODEL
        : "gpt-4o-mini");

  return {
    apiKey,
    provider,
    isGroq,
    endpoint: isGroq
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions",
    textModel,
    visionModel
  };
}

function getOpenAiConfig() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const textModel = process.env.AI_MODEL && !process.env.AI_MODEL.includes("gpt-oss")
    ? process.env.AI_MODEL
    : "gpt-4o-mini";

  return {
    apiKey,
    endpoint: "https://api.openai.com/v1/chat/completions",
    textModel
  };
}

export const aiRuntime = {
  get provider() {
    return getAiConfig().apiKey ? getAiConfig().provider : "demo-mode";
  },
  get demoMode() {
    return !getAiConfig().apiKey;
  }
};

function getResponseOutputText(data: unknown): string {
  if (!data || typeof data !== "object") return "";

  // Standard OpenAI / Groq chat completions format
  if ("choices" in data && Array.isArray((data as { choices?: unknown }).choices)) {
    const choices = (data as { choices: Array<{ message?: { content?: unknown } }> }).choices;
    const content = choices[0]?.message?.content;
    if (typeof content === "string") return content.trim();
  }

  // output_text format
  if ("output_text" in data && typeof (data as { output_text?: unknown }).output_text === "string") {
    return (data as { output_text: string }).output_text.trim();
  }

  // OpenAI Realtime / custom response output format
  if ("output" in data && Array.isArray((data as { output?: unknown }).output)) {
    return (data as { output: Array<{ content?: Array<{ text?: unknown; type?: unknown }> }> }).output
      .flatMap((item) => item.content ?? [])
      .map((item) => (typeof item.text === "string" ? item.text : ""))
      .filter(Boolean)
      .join("\n")
      .trim();
  }

  return "";
}

async function callAI(instructions: string, input: string, fallback: string) {
  const config = getAiConfig();
  if (!config.apiKey) {
    await delay();
    return fallback;
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.textModel,
        messages: [
          {
            role: "system",
            content: instructions
          },
          {
            role: "user",
            content: input
          }
        ],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      return fallback;
    }

    const data = await response.json();
    return getResponseOutputText(data) || fallback;
  } catch {
    return fallback;
  }
}

function getLatestUserMessage(messages: AdaptivaChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
}

function getChatFallback(messages: AdaptivaChatMessage[]) {
  const question = getLatestUserMessage(messages);
  return question
    ? "Ask Adaptiva needs the server-side AI connection to answer this directly. Please check your API key in .env.local."
    : "Ask Adaptiva needs a question to answer.";
}

export async function generateNotesFromTranscript(transcript: string) {
  const config = getOpenAiConfig();
  if (!config.apiKey) {
    return "";
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.textModel,
        messages: [
          {
            role: "system",
            content:
              "You generate clear, structured educational notes from a video transcript. Use only information supported by the transcript. Organize the notes with a title, key points, and a short summary."
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
  const config = getOpenAiConfig();
  if (!config.apiKey) {
    await delay();
    return getChatFallback(messages);
  }

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.textModel,
        messages: [
          {
            role: "system",
            content:
              "You are Ask Adaptiva, a general educational assistant for learners across subjects. When the learner asks a direct educational question, answer the question directly first. For example, if they ask what a concept is, explain that concept; if they ask for a simple explanation, explain it simply; if they ask for an example, include an example. Do not give meta-advice about how to study unless requested. Explain clearly, accurately, and accessibly."
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
    return `${base}\n\nExample-based support: describe the visible objects, labels, or handwritten text in this image, then connect each one to a familiar example.`;
  }
  if (action === "Visual explanation") {
    return `${base}\n\nVisual support: inspect the image from top to bottom, name the important regions, and explain what each region shows.`;
  }
  if (action === "Step-by-step") {
    return `${base}\n\nStep-by-step support:\n1. Look at the title, labels, and main shapes.\n2. Read any scanned text line by line.\n3. Explain each visible part in order.`;
  }

  return `${base}\n\nSimple explanation: this is the uploaded image selected for analysis.`;
}

async function getApiErrorMessage(response: Response, providerName: string) {
  try {
    const data = (await response.json()) as { error?: { code?: string; message?: string } };
    if (data.error?.code === "insufficient_quota") {
      return `${providerName} could not analyze this image because the API key has no available quota.`;
    }
    if (data.error?.code === "invalid_api_key") {
      return `${providerName} could not analyze this image because the API key is invalid.`;
    }
    return data.error?.message ?? `${providerName} could not analyze this image right now.`;
  } catch {
    return `${providerName} could not analyze this image right now.`;
  }
}

export async function analyzeUploadedImage(
  action: ImageAdaptAction,
  image: string,
  filename: string
): Promise<{ result: string; fallback: boolean }> {
  const config = getAiConfig();
  const fallback = describeImageFallback(action, filename, image);

  if (!config.apiKey) {
    await delay();
    return { result: fallback, fallback: true };
  }

  const actionInstructions: Record<ImageAdaptAction, string> = {
    "Simple explanation":
      "1. Transcribe and extract all readable text, titles, labels, or key information from the image.\n2. Provide a clear, simplified, learner-friendly explanation of the main concept in accessible language.",
    "Example":
      "1. Transcribe and extract the visible text and key concepts from the image.\n2. Provide a concrete, intuitive real-world example that clearly illustrates the concept.",
    "Visual explanation":
      "1. Transcribe and extract visible headings, diagram elements, and text.\n2. Describe the visual layout, spatial organization, diagram flow, and structural relationships in detail.",
    "Step-by-step":
      "1. Transcribe and extract the readable text and core facts from the image.\n2. Break the information or process down into sequential, numbered learning steps (Step 1, Step 2, etc.)."
  };

  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.visionModel,
        messages: [
          {
            role: "system",
            content:
              "You are Adaptiva, an accessibility-first educational AI that analyzes uploaded documents, study notes, images, and textbook scans. Help students with learning differences understand the material clearly.\n\nStructure your output with clear markdown headings:\n### 📄 Extracted Content\n(Transcribe or summarize all readable text, labels, equations, and diagrams found in the image)\n\n### 💡 " + action + "\n(Provide the tailored explanation based on the requested format)"
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${actionInstructions[action]}\n\nUploaded file: ${filename}`
              },
              {
                type: "image_url",
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 1200
      })
    });

    if (!response.ok) {
      const errorMsg = await getApiErrorMessage(response, config.isGroq ? "Groq" : "OpenAI");
      return { result: `${errorMsg}\n\n${fallback}`, fallback: true };
    }

    const data = await response.json();
    const content = getResponseOutputText(data);
    if (content) {
      return { result: content, fallback: false };
    }
    return { result: fallback, fallback: true };
  } catch {
    return { result: fallback, fallback: true };
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

  return callAI(
    "Rewrite educational content in accessible plain language. Preserve meaning and avoid medicalized language.",
    `Level: ${level}\n\n${input}`,
    fallback
  );
}

export async function generateExample(input: string) {
  return callAI(
    "Create one concise, concrete example that helps a beginner understand the educational content. Choose the most useful type of example for the topic. Preserve the core idea, but do not restate or summarize the source text. Use clear language.",
    input,
    "Example: imagine the main idea as a familiar everyday process. Each important part has a clear job, and together those jobs produce the result described in the lesson."
  );
}

export async function summarizeContent(input: string) {
  return callAI(
    "Summarize educational content for a learner who benefits from low cognitive load. Use short, clear sentences.",
    input,
    `Main idea: ${input.slice(0, 92)}... The concept becomes easier when it is split into one action at a time.`
  );
}

export async function explainStepByStep(input = featuredLesson.original) {
  const fallback = featuredLesson.stepByStep.join("\n");
  const result = await callAI(
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
  const config = getAiConfig();
  if (!config.apiKey) {
    await delay();
    return fallback;
  }
  const result = await callAI(
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
  const result = await callAI(
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
  const result = await callAI(
    "Create three accessible quiz questions and answers from the learning content.",
    input,
    ""
  );
  if (!result) return fallback;
  return result
    .split(/\n\n+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((block) => ({
      question: block.split("\n")[0] ?? block,
      answer: block.split("\n").slice(1).join(" ") || "Review the concept in the adapted lesson."
    }));
}

export async function translateContent(language: ContentLanguage, input = featuredLesson.simplified) {
  if (language === "English") {
    return callAI(`Keep the content in English. Clarify wording without adding new facts.`, input, input);
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

  return callAI(
    `Translate the educational content into ${language}. Keep scientific terms clear for a learner. Preserve paragraph and line breaks. Do not add new facts.`,
    input,
    usesDemoLesson ? demoFallbackByLanguage[language] : input
  );
}

export async function extractConcepts(input = featuredLesson.original) {
  const result = await callAI(
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
  return callAI(
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
