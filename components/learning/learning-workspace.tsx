"use client";

import {
  BookOpen,
  BarChart2,
  Languages,
  ListChecks,
  Loader2,
  Map,
  MessageCircle,
  ScanText,
  Sparkles,
  Upload,
  Volume2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdaptButton } from "@/components/learning/adapt-button";
import { AudioPlayer } from "@/components/learning/audio-player";
import { MindMap } from "@/components/learning/mind-map";
import { ReadingContent } from "@/components/reading/reading-content";
import { useReadingMode } from "@/components/reading/reading-mode-provider";
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/panel";
import { featuredLesson, mindMapsByLanguage } from "@/lib/demo-data";
import { languageOptions } from "@/lib/i18n/languages";
import { getReadingFontLabel } from "@/lib/reading-mode";
import type { ContentLanguage, MindMapNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const learningOptions = ["Simple Explanation", "Example", "Visual Explanation", "Step by Step"] as const;
type LearningOption = (typeof learningOptions)[number];
const imageModes = ["Original", "Simplified", "Example", "Step-by-Step", "Visual"] as const;
type ImageLearningMode = (typeof imageModes)[number];

const actions = [
  { label: "Simplify", icon: Sparkles },
  { label: "Explain Step-by-Step", icon: ListChecks },
  { label: "Read Aloud", icon: Volume2 },
  { label: "Summarize", icon: ScanText },
  { label: "Create Mind Map", icon: Map },
  { label: "Create Figure", icon: BarChart2 },
  { label: "Translate", icon: Languages },
  { label: "Ask AI", icon: MessageCircle }
];

type Material = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  original_content: string;
};

type AdaptResponse = {
  result?: unknown;
  error?: { message?: string };
};

type ImageAdaptAction = "Simple explanation" | "Example" | "Visual explanation" | "Step-by-step";

type TesseractRuntime = {
  recognize: (
    image: string,
    language: string
  ) => Promise<{
    data: {
      text: string;
    };
  }>;
};

declare global {
  interface Window {
    Tesseract?: TesseractRuntime;
  }
}

function stringifyResult(result: unknown) {
  if (typeof result === "string") return result;
  if (result && typeof result === "object" && "text" in result && typeof (result as { text?: unknown }).text === "string") {
    return (result as { text: string }).text;
  }
  if (Array.isArray(result)) return result.map((item, index) => `Step ${index + 1}: ${String(item)}`).join("\n\n");
  if (result && typeof result === "object") return JSON.stringify(result, null, 2);
  return "";
}

function mindMapFromResult(result: unknown): MindMapNode | null {
  if (!result || typeof result !== "object") return null;
  if ("mindMap" in result && isMindMap((result as { mindMap: unknown }).mindMap)) {
    return (result as { mindMap: MindMapNode }).mindMap;
  }
  if (isMindMap(result)) return result;
  return null;
}

function isMindMap(value: unknown): value is MindMapNode {
  return Boolean(value && typeof value === "object" && "id" in value && "label" in value);
}

function shouldUseLocalOcr(result: string) {
  return (
    result.includes("no available quota") ||
    result.includes("Add an OpenAI API key") ||
    result.includes("Add a Groq API key") ||
    result.includes("API key is invalid") ||
    result.includes("could not analyze this image")
  );
}

function cleanOcrText(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

function parseImageAnalysisOutput(rawOutput: string): { extractedText: string; adaptedText: string } {
  if (!rawOutput) return { extractedText: "", adaptedText: "" };

  const extractedMatch = rawOutput.match(/(?:###\s*(?:📄\s*)?Extracted Content|Extracted text from [^\n:]*:?)\n+([\s\S]*?)(?=\n+###|\n+💡|\n+Simple Explanation:|\n+Example Explanation:|\n+Visual & Structural Breakdown:|\n+Step-by-step Breakdown:|$)/i);
  const adaptedMatch = rawOutput.match(/(?:###\s*(?:💡\s*)?(?:Simple explanation|Example|Visual explanation|Step-by-step|[^\n]+)|(?:Simple Explanation|Example Explanation|Visual & Structural Breakdown|Step-by-step Breakdown):?)\n+([\s\S]*$)/i);

  if (extractedMatch && adaptedMatch && extractedMatch[1].trim() && adaptedMatch[1].trim()) {
    return {
      extractedText: extractedMatch[1].trim(),
      adaptedText: adaptedMatch[1].trim()
    };
  }

  const parts = rawOutput.split(/\n{2,}(?=Example Explanation:|Visual & Structural Breakdown:|Step-by-step Breakdown:|Simple Explanation:|Example:|Visual:|Step-by-step:|Simple:)/i);
  if (parts.length >= 2) {
    return {
      extractedText: parts[0].replace(/^(?:Uploaded image|Extracted text from)[^\n]*\n+/i, "").trim(),
      adaptedText: parts.slice(1).join("\n\n").trim()
    };
  }

  return {
    extractedText: rawOutput,
    adaptedText: rawOutput
  };
}

function formatOcrResult(action: ImageAdaptAction, filename: string, rawText: string) {
  const extractedText = cleanOcrText(rawText);
  if (!extractedText) {
    return {
      extractedText: `Uploaded image: ${filename}\nNo clear readable text could be recognized automatically. Try a sharper scan or photo.`,
      adaptedText: `Could not recognize readable text from ${filename}. Please try uploading a clearer image.`
    };
  }

  const lines = extractedText.split("\n");

  let adapted = "";
  if (action === "Example") {
    adapted = `Think of this content like a reference sheet. For instance, notice the key points ("${lines[0] || 'the main concept'}"): they act like the core rulebook that guides the rest of the subject.`;
  } else if (action === "Visual explanation") {
    adapted = `• Content Overview: The uploaded document contains ${lines.length} readable line(s) organized into sections.\n• Key Headings: ${lines.slice(0, 2).join(" → ")}\n• Body Structure: The content extracted on the left contains the primary subject details.`;
  } else if (action === "Step-by-step") {
    adapted = lines.map((line, index) => `${index + 1}. ${line}`).join("\n");
  } else {
    adapted = `Here is a simplified summary of the extracted content:\n\n${lines.join(" ")}`;
  }

  return {
    extractedText,
    adaptedText: adapted
  };
}

function loadTesseractRuntime() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);

  return new Promise<TesseractRuntime>((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-adaptiva-ocr="true"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(new Error("Local OCR did not load."));
      });
      existingScript.addEventListener("error", () => reject(new Error("Local OCR could not load.")));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.dataset.adaptivaOcr = "true";
    script.onload = () => {
      if (window.Tesseract) resolve(window.Tesseract);
      else reject(new Error("Local OCR did not load."));
    };
    script.onerror = () => reject(new Error("Local OCR could not load."));
    document.head.appendChild(script);
  });
}

// Initial demo scanned document state for demonstration
const demoScannedOriginal = `Photosynthesis is a biochemical process by which photoautotrophic organisms convert light energy into chemical energy. In oxygenic photosynthesis, water functions as the electron donor, yielding molecular oxygen as a byproduct while reducing carbon dioxide into carbohydrate structures.`;
const demoScannedAdapted: Record<ImageLearningMode, string> = {
  Original: demoScannedOriginal,
  Simplified: `Photosynthesis is how green plants make their own food using sunlight. Plants take in water from the soil and carbon dioxide from the air. Using sunlight, they produce sugars for energy and release oxygen for us to breathe.`,
  Example: `Think of a plant leaf like a tiny solar-powered kitchen. Sunlight provides the electricity, water and air are the ingredients, and the plant cooks up sugar (food) while giving off fresh oxygen as clean steam.`,
  "Step-by-Step": `1. Sunlight absorption: Green chlorophyll in plant leaves captures energy from sunlight.\n2. Taking in ingredients: The roots absorb water and the leaves take in carbon dioxide.\n3. Making sugar: Sunlight energy transforms water and carbon dioxide into glucose.\n4. Oxygen release: The plant releases clean oxygen gas into the atmosphere.`,
  Visual: `• Structure Overview: Photosynthesis takes place inside the chloroplasts of plant leaves.\n• Inputs (Left): Sunlight + Water (H₂O) + Carbon Dioxide (CO₂)\n• Reaction Center: Light-dependent reactions in thylakoid membranes\n• Outputs (Right): Glucose (C₆H₁₂O₆) + Oxygen (O₂)`
};

export function LearningWorkspace() {
  const { preferences, speak } = useReadingMode();
  const [mode, setMode] = useState<LearningOption>("Simple Explanation");
  const [learningContent, setLearningContent] = useState<Partial<Record<LearningOption, string>>>({
    "Simple Explanation": featuredLesson.simplified,
    "Step by Step": featuredLesson.stepByStep.map((step, index) => `${index + 1}. ${step}`).join("\n")
  });
  const [learningBusy, setLearningBusy] = useState<LearningOption | null>(null);
  const [learningError, setLearningError] = useState<Partial<Record<LearningOption, string>>>({});
  const [material, setMaterial] = useState<Material | null>(null);
  const [mindMap, setMindMap] = useState<MindMapNode>(featuredLesson.mindMap);
  const [status, setStatus] = useState("Demo lesson loaded.");
  const [language, setLanguage] = useState<ContentLanguage>("English");
  
  // Image / Scanned Document state (Dual Panel Comparison Layout)
  const [activeImageMode, setActiveImageMode] = useState<ImageLearningMode>("Simplified");
  const [extractedImageText, setExtractedImageText] = useState<string>(demoScannedOriginal);
  const [imageAdaptedByMode, setImageAdaptedByMode] = useState<Record<ImageLearningMode, string>>(demoScannedAdapted);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>({
    name: "sample-biology-scan.png",
    dataUrl: "/hero-illustration.png"
  });
  const [imageBusy, setImageBusy] = useState<boolean>(false);
  const [imageStatus, setImageStatus] = useState<string>("Sample scanned material loaded.");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const imageOcrTextRef = useRef<{ dataUrl: string; text: string } | null>(null);
  const imageOriginalRef = useRef<{ dataUrl: string; text: string } | null>(null);
  const imageCacheRef = useRef<Record<string, Partial<Record<ImageLearningMode, { extracted: string; adapted: string }>>>>({});

  const sourceText = material?.original_content ?? featuredLesson.original;
  const materialTitle = material?.title ?? featuredLesson.title;
  const courseLabel = material?.description ?? featuredLesson.course;
  const displayedText = learningContent[mode] ?? "";

  async function generateLearningContent(target: Exclude<LearningOption, "Visual Explanation">) {
    if (learningContent[target]) return;

    const action = target === "Simple Explanation" ? "simplify" : target === "Example" ? "example" : "step-by-step";
    setLearningBusy(target);
    setLearningError((current) => ({ ...current, [target]: "" }));
    try {
      const response = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // This is a read-only adaptation request. Do not attach a material ID,
        // because guests can still use the Learn views without persistence.
        body: JSON.stringify({ action, text: sourceText, language, save_as_note: false })
      });
      const payload = (await response.json()) as AdaptResponse;
      if (!response.ok) throw new Error(payload.error?.message ?? "Could not create this learning view.");
      const result = stringifyResult(payload.result).trim();
      if (!result) throw new Error("No learning content was returned. Please try again.");
      setLearningContent((current) => ({ ...current, [target]: result }));
    } catch (error) {
      setLearningError((current) => ({
        ...current,
        [target]: error instanceof Error ? error.message : "Could not create this learning view."
      }));
    } finally {
      setLearningBusy(null);
    }
  }

  function selectLearningOption(nextMode: LearningOption) {
    setMode(nextMode);
    if (nextMode !== "Visual Explanation") void generateLearningContent(nextMode);
  }

  useEffect(() => {
    async function loadMaterial() {
      try {
        const params = new URLSearchParams(window.location.search);
        const selectedId = params.get("material");
        const response = await fetch(selectedId ? `/api/materials/${selectedId}` : "/api/materials");
        const payload = (await response.json()) as {
          material?: Material;
          materials?: Material[];
          mode?: string;
          error?: { message?: string };
        };
        if (!response.ok) throw new Error(payload.error?.message ?? "Could not load material.");
        const nextMaterial = payload.material ?? payload.materials?.[0] ?? null;
        if (nextMaterial) {
          setMaterial(nextMaterial);
          setLearningContent({});
          setLearningError({});
          setStatus(payload.mode === "demo" ? "Demo material loaded from API fallback." : "Saved material loaded.");
        }
      } catch {
        setStatus("Using built-in demo lesson because materials could not be loaded.");
      }
    }

    void loadMaterial();
  }, []);

  useEffect(() => {
    if (mode !== "Visual Explanation") void generateLearningContent(mode);
    // A new material clears the cache above; this effect creates the selected learning view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceText]);

  async function runAction(action: string) {
    setStatus(`${action} is processing...`);
    const actionMap: Record<string, "simplify" | "step-by-step" | "summarize" | "mind-map" | "translate" | "ask"> = {
      Simplify: "simplify",
      "Explain Step-by-Step": "step-by-step",
      Summarize: "summarize",
      "Create Mind Map": "mind-map",
      Translate: "translate",
      "Ask AI": "ask"
    };

    const apiAction = actionMap[action];
    if (action === "Read Aloud") {
      if (mode === "Visual Explanation") {
        setStatus("Visual Explanation is a mind map. Select a text-based learning option to read it aloud.");
        return;
      }
      speak(displayedText || sourceText);
      setStatus("Reading aloud with sentence highlighting.");
      return;
    }

    if (action === "Create Figure") {
      const encoded = encodeURIComponent(sourceText);
      window.location.href = `/learn/figure?content=${encoded}`;
      return;
    }

    if (!apiAction) {
      return;
    }

    try {
      const nextLanguage =
        action === "Translate"
          ? languageOptions[(languageOptions.findIndex((item) => item.value === language) + 1) % languageOptions.length]!.value
          : language;
      const response = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: apiAction,
          text: action === "Translate" ? displayedText || sourceText : sourceText,
          language: nextLanguage,
          mind_map: mindMap,
          material_id: material?.id,
          save_as_note: false
        })
      });
      const payload = (await response.json()) as AdaptResponse;
      if (!response.ok) throw new Error(payload.error?.message ?? "Adaptation failed.");

      if (apiAction === "translate") {
        const translatedText = stringifyResult(payload.result);
        setLanguage(nextLanguage);
        if (mode !== "Visual Explanation") {
          setLearningContent((current) => ({ ...current, [mode]: translatedText }));
        }
        const translatedMap = mindMapFromResult(payload.result) ?? mindMapsByLanguage[nextLanguage];
        setMindMap(translatedMap);
        setStatus(`Translated to ${nextLanguage}. Visual mode keeps the same concept-map layout.`);
      } else if (apiAction === "mind-map" && payload.result && typeof payload.result === "object" && "label" in payload.result) {
        setMindMap(payload.result as MindMapNode);
        setMode("Visual Explanation");
      } else {
        const target = apiAction === "step-by-step" ? "Step by Step" : "Simple Explanation";
        setLearningContent((current) => ({ ...current, [target]: stringifyResult(payload.result) }));
        setMode(target);
      }
      if (apiAction !== "translate") setStatus(`${action} complete.`);
      void fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: material?.id,
          concept: materialTitle,
          status: "learning",
          mastery_level: 55,
          session: { mode: action, duration_seconds: 180, completed: false }
        })
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Adaptation failed. Demo content remains available.");
    }
  }

  async function saveCurrentNote() {
    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          material_id: material?.id,
          title: `${materialTitle} - ${mode} note`,
          content: mode === "Visual Explanation" ? JSON.stringify(mindMap, null, 2) : displayedText,
          note_type: mode.toLowerCase()
        })
      });
      if (!response.ok) throw new Error("Could not save note.");
      setStatus("Adapted note saved.");
    } catch {
      setStatus("Could not save note to persistence. The learning content remains visible.");
    }
  }

  function uploadImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setImageStatus("Could not read image file. Please try another file.");
        return;
      }
      imageOcrTextRef.current = null;
      imageOriginalRef.current = null;
      imageCacheRef.current[dataUrl] = {};
      setExtractedImageText("");
      setImageAdaptedByMode({ Original: "", Simplified: "", Example: "", "Step-by-Step": "", Visual: "" });
      const imgData = { name: file.name, dataUrl };
      setUploadedImage(imgData);

      // Trigger automatic extraction & adaptation
      void processImage(activeImageMode, imgData);
    };
    reader.onerror = () => {
      setImageStatus("Could not read image file. Please try another image.");
    };
    reader.readAsDataURL(file);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  async function readImageLocally(selectedImage: { name: string; dataUrl: string }) {
    if (imageOcrTextRef.current?.dataUrl === selectedImage.dataUrl) return imageOcrTextRef.current.text;
    const tesseract = await loadTesseractRuntime();
    const ocrResult = await tesseract.recognize(selectedImage.dataUrl, "eng");
    const text = ocrResult.data.text;
    imageOcrTextRef.current = { dataUrl: selectedImage.dataUrl, text };
    return text;
  }

  function mapModeToAction(m: ImageLearningMode): ImageAdaptAction {
    if (m === "Example") return "Example";
    if (m === "Step-by-Step") return "Step-by-step";
    if (m === "Visual") return "Visual explanation";
    return "Simple explanation";
  }

  async function generateImageModeFromOriginal(
    targetMode: Exclude<ImageLearningMode, "Original">,
    originalText: string,
    selectedImage: { name: string; dataUrl: string }
  ) {
    const action = targetMode === "Simplified" ? "simplify" : targetMode === "Example" ? "example" : targetMode === "Step-by-Step" ? "step-by-step" : "mind-map";
    const response = await fetch("/api/adapt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, text: originalText, language, save_as_note: false })
    });
    const payload = (await response.json()) as AdaptResponse;
    if (!response.ok) throw new Error(payload.error?.message ?? `Could not create ${targetMode} Mode.`);

    if (targetMode === "Visual") {
      const nextMap = mindMapFromResult(payload.result);
      if (!nextMap) throw new Error("Could not create a mind map from the extracted content.");
      setMindMap(nextMap);
      return;
    }

    const adapted = stringifyResult(payload.result).trim();
    if (!adapted) throw new Error(`Could not create ${targetMode} Mode.`);
    setImageAdaptedByMode((current) => ({ ...current, [targetMode]: adapted }));
    imageCacheRef.current[selectedImage.dataUrl] ??= {};
    imageCacheRef.current[selectedImage.dataUrl]![targetMode] = { extracted: originalText, adapted };
  }

  async function processImage(targetMode: ImageLearningMode, selectedImage = uploadedImage) {
    setActiveImageMode(targetMode);

    if (!selectedImage) {
      imageInputRef.current?.click();
      return;
    }

    const originalForImage = imageOriginalRef.current?.dataUrl === selectedImage.dataUrl ? imageOriginalRef.current.text : "";
    if (originalForImage) {
      if (targetMode === "Original") {
        setExtractedImageText(originalForImage);
        setImageStatus(`Showing Original Content from ${selectedImage.name}.`);
        return;
      }

      const cachedAdaptation = imageCacheRef.current[selectedImage.dataUrl]?.[targetMode];
      if (cachedAdaptation && targetMode !== "Visual") {
        setImageAdaptedByMode((current) => ({ ...current, [targetMode]: cachedAdaptation.adapted }));
        setImageStatus(`Showing ${targetMode} Mode from the original content.`);
        return;
      }

      setImageBusy(true);
      setImageStatus(`Creating ${targetMode} Mode from the original extracted content...`);
      try {
        await generateImageModeFromOriginal(targetMode, originalForImage, selectedImage);
        setImageStatus(`${targetMode} Mode created from the original content.`);
      } catch (error) {
        setImageStatus(error instanceof Error ? error.message : `Could not create ${targetMode} Mode.`);
      } finally {
        setImageBusy(false);
      }
      return;
    }

    // Check cache
    const cached = imageCacheRef.current[selectedImage.dataUrl]?.[targetMode];
    if (cached) {
      setExtractedImageText(cached.extracted);
      setImageAdaptedByMode((prev) => ({ ...prev, [targetMode]: cached.adapted }));
      setImageStatus(`Showing ${targetMode} Mode from ${selectedImage.name}.`);
      return;
    }

    const action = mapModeToAction(targetMode);
    setImageBusy(true);
    setImageStatus(`Extracting & adapting ${selectedImage.name} (${targetMode} Mode)...`);

    try {
      const response = await fetch("/api/image-adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          image: selectedImage.dataUrl,
          filename: selectedImage.name
        })
      });

      const payload = (await response.json()) as { result?: string; fallback?: boolean; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Image explanation failed.");

      const apiResult = payload.result?.trim() || "";

      if (payload.fallback || shouldUseLocalOcr(apiResult)) {
        setImageStatus(`Transcribing "${selectedImage.name}" via OCR...`);
        try {
          const rawOcr = await readImageLocally(selectedImage);
          const ocrFormatted = formatOcrResult(action, selectedImage.name, rawOcr);

          setExtractedImageText(ocrFormatted.extractedText);
          imageOriginalRef.current = { dataUrl: selectedImage.dataUrl, text: ocrFormatted.extractedText };
          setImageAdaptedByMode((prev) => ({
            ...prev,
            Original: ocrFormatted.extractedText,
            [targetMode]: ocrFormatted.adaptedText
          }));

          // Pre-populate cache for all modes
          if (!imageCacheRef.current[selectedImage.dataUrl]) {
            imageCacheRef.current[selectedImage.dataUrl] = {};
          }
          const allModes: ImageLearningMode[] = ["Original", "Simplified", "Example", "Step-by-Step", "Visual"];
          for (const m of allModes) {
            const res = formatOcrResult(mapModeToAction(m), selectedImage.name, rawOcr);
            imageCacheRef.current[selectedImage.dataUrl]![m] = {
              extracted: res.extractedText,
              adapted: m === "Original" ? res.extractedText : res.adaptedText
            };
          }

          if (targetMode === "Visual") {
            await generateImageModeFromOriginal("Visual", ocrFormatted.extractedText, selectedImage);
          }

          setImageStatus(`Image extracted and adapted successfully (${targetMode} Mode).`);
        } catch {
          setExtractedImageText(`Uploaded image: ${selectedImage.name}`);
          setImageAdaptedByMode((prev) => ({ ...prev, [targetMode]: apiResult }));
          setImageStatus(`Image analysis complete.`);
        }
        return;
      }

      // Parse AI output into original extracted text and adapted explanation
      const parsed = parseImageAnalysisOutput(apiResult);
      const extracted = parsed.extractedText || `Uploaded image: ${selectedImage.name}`;
      const adaptedText = targetMode === "Original" ? extracted : parsed.adaptedText;

      setExtractedImageText(extracted);
      imageOriginalRef.current = { dataUrl: selectedImage.dataUrl, text: extracted };
      setImageAdaptedByMode((prev) => ({
        ...prev,
        Original: extracted,
        [targetMode]: adaptedText
      }));

      if (!imageCacheRef.current[selectedImage.dataUrl]) {
        imageCacheRef.current[selectedImage.dataUrl] = {};
      }
      imageCacheRef.current[selectedImage.dataUrl]![targetMode] = {
        extracted,
        adapted: adaptedText
      };

      if (targetMode === "Visual") {
        await generateImageModeFromOriginal("Visual", extracted, selectedImage);
      }

      setImageStatus(`Image extracted and adapted successfully (${targetMode} Mode).`);
    } catch (error) {
      setImageStatus(error instanceof Error ? error.message : "Could not analyze the uploaded image.");
    } finally {
      setImageBusy(false);
    }
  }

  // Load current extracted image text as active lesson in main workspace
  function applyImageToMainWorkspace() {
    if (!extractedImageText) return;
    const title = uploadedImage ? uploadedImage.name.replace(/\.[^/.]+$/, "") : "Scanned Document Lesson";
    setMaterial({
      id: "uploaded-image-lesson",
      title: title.charAt(0).toUpperCase() + title.slice(1),
      description: "Uploaded document lesson",
      content_type: "image",
      original_content: extractedImageText
    });
    setLearningContent({});
    setLearningError({});
    setMode("Simple Explanation");
    setStatus(`Loaded "${title}" into main adaptive workspace.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const currentImageAdaptedText =
    activeImageMode === "Original"
      ? extractedImageText
      : imageAdaptedByMode[activeImageMode] || extractedImageText;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Workspace Header */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Badge>Learning Workspace</Badge>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-ink sm:text-5xl">
            Same lesson, adapted around the learner.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-graphite">
            Featured demo: {courseLabel} / {materialTitle}
          </p>
          <p className="mt-2 text-sm font-bold text-moss">{status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge>Reading mode: {getReadingFontLabel(preferences.font)}</Badge>
          <Badge>Language: {language}</Badge>
        </div>
      </div>

      {/* Main Adapt Button */}
      <div className="mt-8">
        <AdaptButton
          onComplete={() => {
            setMode("Simple Explanation");
            setLearningContent((current) => ({ ...current, "Simple Explanation": featuredLesson.simplified }));
            setStatus("Adaptiva created a simplified, chunked, audio-ready learning mode.");
          }}
        />
      </div>

      {/* Main Learning Modes Tabs */}
      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Learning modes">
        {learningOptions.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            className={cn(
              "min-h-11 rounded-card border px-4 text-sm font-black transition",
              mode === item ? "border-ink bg-ink text-white" : "border-ink/10 bg-white text-graphite hover:bg-cloud"
            )}
            onClick={() => selectLearningOption(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {/* Main Dual Panels: Original Content vs Adapted by Adaptiva */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <Panel>
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-graphite">
                Original Content
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">{materialTitle}</h2>
            </div>
            <BookOpen aria-hidden="true" className="text-moss" size={28} />
          </div>
          <ReadingContent className="mt-5 text-lg leading-9 text-graphite" text={sourceText} />
        </Panel>
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
                Adapted by Adaptiva
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">{mode}</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-card border border-ink/10 bg-cloud px-3 py-1 text-xs font-bold text-ink">
                English
              </span>
              {mode !== "Visual Explanation" && <AudioPlayer text={displayedText} language={language} />}
            </div>
          </div>
          {mode === "Visual Explanation" ? (
            <div className="mt-5">
              <MindMap key={`${language}-${mindMap.id}`} node={mindMap} language={language} />
            </div>
          ) : (
            <div className="mt-5">
              {learningBusy === mode ? (
                <div className="flex min-h-32 items-center gap-3 text-graphite" role="status">
                  <Loader2 aria-hidden="true" className="animate-spin text-moss" size={22} />
                  Creating your {mode.toLowerCase()}…
                </div>
              ) : learningError[mode] ? (
                <p className="rounded-card border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
                  {learningError[mode]}
                </p>
              ) : displayedText ? (
                <ReadingContent className="text-lg leading-9 text-ink" text={displayedText} />
              ) : (
                <p className="text-graphite">Choose this option to create a learning view from the original content.</p>
              )}
            </div>
          )}
        </Panel>
      </div>

      {/* Main Adaptive Actions Bar */}
      <section className="mt-6">
        <h2 className="text-2xl font-black text-ink">Adaptive Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                type="button"
                className="flex min-h-24 flex-col items-start justify-between rounded-card border border-ink/10 bg-paper p-3 text-left text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={() => void runAction(action.label)}
              >
                <Icon aria-hidden="true" className="text-moss" size={22} />
                {action.label}
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex justify-end">
          <Button type="button" variant="secondary" onClick={() => void saveCurrentNote()}>
            Save adapted note
          </Button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* IMAGE / SCANNED DOCUMENT SECTION (Exact Dual Comparison Layout) */}
      {/* ========================================================================= */}
      <section className="mt-14 border-t border-ink/10 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Badge>Image & Scanned Document</Badge>
            <h2 className="mt-3 text-3xl font-black text-ink">
              OCR & Visual Learning
            </h2>
            <p className="mt-2 text-base text-graphite">
              Upload textbook pages, diagrams, or handwritten notes. Adaptiva transcribes the content and creates accessible learning modes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={imageInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => uploadImage(event.target.files?.[0])}
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => imageInputRef.current?.click()}
            >
              <Upload aria-hidden="true" size={16} />
              {uploadedImage ? "Upload new image" : "Upload image"}
            </Button>
            {uploadedImage && (
              <Button
                type="button"
                variant="primary"
                onClick={applyImageToMainWorkspace}
                title="Load this extracted scan into the main workspace above"
              >
                <Sparkles aria-hidden="true" size={16} />
                Use in full workspace
              </Button>
            )}
          </div>
        </div>

        {/* Mode Switcher Tabs (Identical to top workspace tabs) */}
        <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Image learning modes">
          {imageModes.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              aria-selected={activeImageMode === item}
              className={cn(
                "min-h-11 rounded-card border px-4 text-sm font-black transition",
                activeImageMode === item
                  ? "border-ink bg-ink text-white"
                  : "border-ink/10 bg-white text-graphite hover:bg-cloud"
              )}
              onClick={() => void processImage(item)}
            >
              {item}
            </button>
          ))}
        </div>

        {/* Dual Side-by-Side Comparison Panels */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          {/* Left Panel: ORIGINAL CONTENT */}
          <Panel>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-graphite">
                  Original Content
                </p>
                <h3 className="mt-2 text-2xl font-black text-ink">
                  {uploadedImage ? uploadedImage.name.replace(/\.[^/.]+$/, "") : "Uploaded Scanned Page"}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen aria-hidden="true" className="text-moss" size={28} />
              </div>
            </div>

            {uploadedImage ? (
              <div className="mt-4 flex items-center gap-3 rounded-card border border-ink/10 bg-paper p-2">
                <img
                  src={uploadedImage.dataUrl}
                  alt={uploadedImage.name}
                  className="h-14 w-20 rounded object-cover border border-ink/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-ink">{uploadedImage.name}</p>
                  <p className="text-[11px] font-bold text-moss">Extracted via OCR & Vision</p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                >
                  Change
                </Button>
              </div>
            ) : null}

            {imageBusy ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 aria-hidden="true" size={32} className="animate-spin text-moss" />
                <p className="font-black text-ink">Extracting text from image...</p>
              </div>
            ) : (
              <ReadingContent
                className="mt-5 text-lg leading-9 text-graphite"
                text={
                  extractedImageText ||
                  "Upload an image or scanned document to see the original extracted text displayed here with dyslexia support and word definitions."
                }
              />
            )}
          </Panel>

          {/* Right Panel: ADAPTED BY ADAPTIVA */}
          <Panel>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
                  Adapted by Adaptiva
                </p>
                <h3 className="mt-2 text-2xl font-black text-ink">{activeImageMode} Mode</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-card border border-ink/10 bg-cloud px-3 py-1 text-xs font-bold text-ink">
                  English
                </span>
                {activeImageMode !== "Visual" && <AudioPlayer text={currentImageAdaptedText} language={language} />}
              </div>
            </div>

            {imageBusy ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <Loader2 aria-hidden="true" size={32} className="animate-spin text-moss" />
                <p className="font-black text-ink">Generating {activeImageMode} Mode...</p>
              </div>
            ) : activeImageMode === "Visual" ? (
              <div className="mt-5">
                <MindMap key={`${language}-${mindMap.id}`} node={mindMap} language={language} />
              </div>
            ) : (
              <ReadingContent
                className="mt-5 text-lg leading-9 text-ink"
                text={
                  currentImageAdaptedText ||
                  "Select an adapted learning mode above to see the personalized accessible explanation for your uploaded image."
                }
              />
            )}
          </Panel>
        </div>

        {/* Status text matching screenshot */}
        <p className="mt-4 text-xs font-bold text-moss">
          {imageStatus}
        </p>
      </section>
    </div>
  );
}
