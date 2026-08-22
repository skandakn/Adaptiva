"use client";

import {
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  FileImage,
  BarChart2,
  Languages,
  Layers,
  ListChecks,
  Loader2,
  Map,
  MessageCircle,
  ScanText,
  Sparkles,
  Volume2
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AdaptButton } from "@/components/learning/adapt-button";
import { AudioPlayer } from "@/components/learning/audio-player";
import { FocusMode } from "@/components/learning/focus-mode";
import { MindMap } from "@/components/learning/mind-map";
import { ReadingContent } from "@/components/reading/reading-content";
import { useReadingMode } from "@/components/reading/reading-mode-provider";
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/panel";
import { featuredLesson, keyConceptsByLanguage, mindMapsByLanguage } from "@/lib/demo-data";
import { languageOptions } from "@/lib/i18n/languages";
import { getReadingFontLabel } from "@/lib/reading-mode";
import type { ContentLanguage, LearningMode, MindMapNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const modes: LearningMode[] = ["Original", "Simplified", "Focus", "Audio", "Visual"];

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

type TranslatedContent = Partial<Record<LearningMode, string>>;
type ImageAdaptAction = "Simple explanation" | "Example" | "Visual explanation" | "Step-by-step";
type ImageResult = {
  action: ImageAdaptAction;
  text: string;
};

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

function formatOcrResult(action: ImageAdaptAction, filename: string, rawText: string) {
  const extractedText = cleanOcrText(rawText);
  if (!extractedText) {
    return `Uploaded image: ${filename}\n\nI could not read clear text from this image. Try a sharper scan, higher contrast photo, or crop closer to the document.`;
  }

  const lines = extractedText.split("\n");
  const mainText = lines.join("\n");

  if (action === "Example") {
    return `Extracted text from ${filename}:\n\n${mainText}\n\nExample Explanation:\nThink of this content like a reference sheet. For instance, notice the key points above ("${lines[0] || 'the main concept'}"): they act like the core rulebook that guides the rest of the subject.`;
  }

  if (action === "Visual explanation") {
    return `Extracted text from ${filename}:\n\n${mainText}\n\nVisual & Structural Breakdown:\n• Content Overview: The uploaded document contains ${lines.length} readable line(s) of educational text.\n• Top / Section Header: ${lines.slice(0, 2).join(" → ")}\n• Key Body Information: The text extracted above represents the primary subject details.`;
  }

  if (action === "Step-by-step") {
    return `Extracted text from ${filename}:\n\n${mainText}\n\nStep-by-step Breakdown:\n${lines.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;
  }

  return `Extracted text from ${filename}:\n\n${mainText}\n\nSimple Explanation:\nHere is a simplified summary of the extracted content:\n${lines.join(" ")}`;
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

export function LearningWorkspace() {
  const { preferences, speak } = useReadingMode();
  const [mode, setMode] = useState<LearningMode>("Simplified");
  const [adapted, setAdapted] = useState(featuredLesson.simplified);
  const [material, setMaterial] = useState<Material | null>(null);
  const [mindMap, setMindMap] = useState<MindMapNode>(featuredLesson.mindMap);
  const [status, setStatus] = useState("Demo lesson loaded.");
  const [language, setLanguage] = useState<ContentLanguage>("English");
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent>({});
  
  // Image / Scanned Document state
  const [activeImageAction, setActiveImageAction] = useState<ImageAdaptAction>("Simple explanation");
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [imageBusy, setImageBusy] = useState<ImageAdaptAction | null>(null);
  const [copiedImageResult, setCopiedImageResult] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageActionRef = useRef<ImageAdaptAction | null>(null);
  const imageOcrTextRef = useRef<{ dataUrl: string; text: string } | null>(null);
  const imageCacheRef = useRef<Record<string, Partial<Record<ImageAdaptAction, string>>>>({});

  const sourceText = material?.original_content ?? featuredLesson.original;
  const materialTitle = material?.title ?? featuredLesson.title;
  const courseLabel = material?.description ?? featuredLesson.course;
  const displayedText = translatedContent[mode] ?? (mode === "Original" ? sourceText : adapted);
  const focusConcepts = keyConceptsByLanguage[language] ?? featuredLesson.keyConcepts;
  const readingTransform = materialTitle.toLowerCase().includes("photosynthesis")
    ? "Photosynthesis\n\nPlants use sunlight to make food.\n\nMain idea:\nSUNLIGHT\nPLANT\nFOOD"
    : `${materialTitle}\n\nA cell copies its DNA before it divides.\n\nMain idea:\nDNA OPENS\nMATCHING BASES JOIN\nTWO COPIES FORM`;

  function contentForMode(learningMode: LearningMode) {
    if (learningMode === "Original") return sourceText;
    if (learningMode === "Focus") return focusConcepts.join("\n");
    if (learningMode === "Visual" || learningMode === "Audio") return adapted;
    return adapted;
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
          setAdapted(nextMaterial.original_content);
          setStatus(payload.mode === "demo" ? "Demo material loaded from API fallback." : "Saved material loaded.");
        }
      } catch {
        setStatus("Using built-in demo lesson because materials could not be loaded.");
      }
    }

    void loadMaterial();
  }, []);

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
      setMode("Audio");
      speak(displayedText);
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
          text: action === "Translate" ? contentForMode(mode) : sourceText,
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
        setTranslatedContent((current) => ({
          ...current,
          Simplified: translatedText,
          ...(mode === "Original" || mode === "Focus" || mode === "Audio" ? { [mode]: translatedText } : {})
        }));
        setAdapted(translatedText);
        const translatedMap = mindMapFromResult(payload.result) ?? mindMapsByLanguage[nextLanguage];
        setMindMap(translatedMap);
        setStatus(`Translated to ${nextLanguage}. Visual mode keeps the same concept-map layout.`);
      } else if (apiAction === "mind-map" && payload.result && typeof payload.result === "object" && "label" in payload.result) {
        setMindMap(payload.result as MindMapNode);
        setMode("Visual");
      } else {
        setAdapted(stringifyResult(payload.result));
        setMode("Simplified");
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
          content: adapted,
          note_type: mode.toLowerCase()
        })
      });
      if (!response.ok) throw new Error("Could not save note.");
      setStatus("Adapted note saved.");
    } catch {
      setStatus("Could not save note to persistence. The adapted content remains visible.");
    }
  }

  function uploadImage(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === "string" ? reader.result : "";
      if (!dataUrl) {
        setImageResult({ action: activeImageAction, text: "Could not read this image. Try another file." });
        return;
      }
      imageOcrTextRef.current = null;
      imageCacheRef.current[dataUrl] = {};
      const imgData = { name: file.name, dataUrl };
      setUploadedImage(imgData);

      const targetAction = pendingImageActionRef.current ?? activeImageAction;
      pendingImageActionRef.current = null;
      setActiveImageAction(targetAction);

      // Automatically extract information and analyze upon upload
      void runImageAction(targetAction, imgData);
    };
    reader.onerror = () => {
      pendingImageActionRef.current = null;
      setImageResult({
        action: activeImageAction,
        text: "Could not read this image file. Please try another image."
      });
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

  async function runImageAction(action: ImageAdaptAction, selectedImage = uploadedImage) {
    setActiveImageAction(action);

    if (!selectedImage) {
      pendingImageActionRef.current = action;
      imageInputRef.current?.click();
      return;
    }

    // Check if result for this specific action is already cached
    const cached = imageCacheRef.current[selectedImage.dataUrl]?.[action];
    if (cached) {
      setImageResult({ action, text: cached });
      setImageBusy(null);
      return;
    }

    // If local OCR text is already available for this image, instantly format it
    if (imageOcrTextRef.current?.dataUrl === selectedImage.dataUrl && imageOcrTextRef.current.text) {
      const formatted = formatOcrResult(action, selectedImage.name, imageOcrTextRef.current.text);
      if (!imageCacheRef.current[selectedImage.dataUrl]) {
        imageCacheRef.current[selectedImage.dataUrl] = {};
      }
      imageCacheRef.current[selectedImage.dataUrl]![action] = formatted;
      setImageResult({ action, text: formatted });
      return;
    }

    setImageBusy(action);
    setImageResult({
      action,
      text: `Extracting text and generating ${action.toLowerCase()} for "${selectedImage.name}"...`
    });

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

      const apiResult = payload.result?.trim() || "No explanation was returned for this image.";

      if (payload.fallback || shouldUseLocalOcr(apiResult)) {
        setImageResult({
          action,
          text: `Extracting readable text via OCR from "${selectedImage.name}"...`
        });
        try {
          const rawOcr = await readImageLocally(selectedImage);
          const formatted = formatOcrResult(action, selectedImage.name, rawOcr);

          if (!imageCacheRef.current[selectedImage.dataUrl]) {
            imageCacheRef.current[selectedImage.dataUrl] = {};
          }
          imageCacheRef.current[selectedImage.dataUrl]![action] = formatted;

          // Pre-cache other action modes from this OCR extraction
          const allActions: ImageAdaptAction[] = ["Simple explanation", "Example", "Visual explanation", "Step-by-step"];
          for (const act of allActions) {
            imageCacheRef.current[selectedImage.dataUrl]![act] = formatOcrResult(act, selectedImage.name, rawOcr);
          }

          setImageResult({
            action,
            text: formatted
          });
        } catch {
          setImageResult({
            action,
            text: apiResult
          });
        }
        return;
      }

      if (!imageCacheRef.current[selectedImage.dataUrl]) {
        imageCacheRef.current[selectedImage.dataUrl] = {};
      }
      imageCacheRef.current[selectedImage.dataUrl]![action] = apiResult;

      setImageResult({
        action,
        text: apiResult
      });
    } catch (error) {
      setImageResult({
        action,
        text: error instanceof Error ? error.message : "Could not analyze the uploaded image."
      });
    } finally {
      setImageBusy(null);
    }
  }

  useEffect(() => {
    if (mode === "Original") setStatus("Showing original source material.");
    if (mode === "Focus") setStatus("Focus mode hides non-essential content.");
  }, [mode]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
          <Badge>Reading mode: {getReadingFontLabel(preferences.fontFamily)}</Badge>
          <Badge>Language: {language}</Badge>
        </div>
      </div>

      <div className="mt-8">
        <AdaptButton
          onComplete={() => {
            setMode("Simplified");
            setAdapted(featuredLesson.simplified);
            setStatus("Adaptiva created a simplified, chunked, audio-ready learning mode.");
          }}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Learning modes">
        {modes.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={mode === item}
            className={cn(
              "min-h-11 rounded-card border px-4 text-sm font-black transition",
              mode === item ? "border-ink bg-ink text-white" : "border-ink/10 bg-white text-graphite hover:bg-cloud"
            )}
            onClick={() => setMode(item)}
          >
            {item}
          </button>
        ))}
      </div>

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
              <h2 className="mt-2 text-2xl font-black text-ink">{mode} Mode</h2>
            </div>
            <AudioPlayer text={displayedText} />
          </div>
          {mode === "Visual" ? (
            <div className="mt-5">
              <MindMap data={mindMap} />
            </div>
          ) : mode === "Focus" ? (
            <div className="mt-5">
              <FocusMode concepts={focusConcepts} title={materialTitle} />
            </div>
          ) : (
            <ReadingContent
              className="mt-5 text-lg leading-9 text-ink"
              text={mode === "Original" ? readingTransform : displayedText}
            />
          )}
        </Panel>
      </div>

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

      {/* Image / Scanned Document Section */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel>
          <div className="flex items-start gap-3">
            <FileImage aria-hidden="true" className="text-moss" size={28} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
                Image / Scanned Document
              </p>
              <h2 className="mt-1 text-2xl font-black text-ink">OCR & Visual Learning</h2>
            </div>
          </div>

          <label className="mt-5 grid min-h-28 cursor-pointer place-items-center rounded-card border-2 border-dashed border-moss/45 bg-mint/10 p-4 text-center font-black text-moss transition hover:bg-mint/20 hover:border-moss">
            <div className="flex flex-col items-center gap-2">
              <ScanText aria-hidden="true" size={24} className="text-moss" />
              <span className="text-sm font-bold text-ink">
                {uploadedImage ? uploadedImage.name : "Click to upload image or scanned document"}
              </span>
              <span className="text-xs font-normal text-graphite">Supports PNG, JPG, JPEG, WEBP</span>
            </div>
            <input
              ref={imageInputRef}
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={(event) => uploadImage(event.target.files?.[0])}
            />
          </label>

          {uploadedImage ? (
            <div className="mt-4 overflow-hidden rounded-card border border-ink/10 bg-paper">
              <img src={uploadedImage.dataUrl} alt={uploadedImage.name} className="max-h-60 w-full object-contain p-2" />
            </div>
          ) : null}

          <Button
            className="mt-4 w-full"
            type="button"
            variant="secondary"
            disabled={Boolean(imageBusy)}
            onClick={() => {
              if (!uploadedImage) {
                imageInputRef.current?.click();
              } else {
                void runImageAction(activeImageAction);
              }
            }}
          >
            {imageBusy ? (
              <>
                <Loader2 aria-hidden="true" size={18} className="animate-spin text-moss" />
                Analyzing {activeImageAction}...
              </>
            ) : (
              <>
                <ScanText aria-hidden="true" size={18} />
                {uploadedImage ? `Extract & Explain with ${activeImageAction}` : "Upload an image to extract text"}
              </>
            )}
          </Button>
        </Panel>

        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Uploaded Image Support</p>
              <h2 className="mt-1 text-2xl font-black text-ink">
                Choose explanation style
              </h2>
            </div>
            {uploadedImage ? (
              <span className="rounded-card border border-moss/30 bg-mint/14 px-3 py-1 text-xs font-bold text-moss">
                📄 {uploadedImage.name}
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { label: "Simple explanation" as ImageAdaptAction, icon: Sparkles, desc: "Plain language summary & key ideas" },
              { label: "Example" as ImageAdaptAction, icon: BookOpen, desc: "Concrete real-world analogy" },
              { label: "Visual explanation" as ImageAdaptAction, icon: Layers, desc: "Layout & visual structure breakdown" },
              { label: "Step-by-step" as ImageAdaptAction, icon: ListChecks, desc: "Ordered sequential learning steps" }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeImageAction === item.label;
              const isItemBusy = imageBusy === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  className={cn(
                    "flex min-h-16 flex-col justify-center rounded-card border px-4 py-3 text-left transition",
                    isSelected
                      ? "border-moss bg-mint/14 shadow-sm ring-2 ring-moss/40"
                      : "border-ink/10 bg-paper hover:border-moss/40 hover:bg-cloud",
                    isItemBusy && "opacity-80"
                  )}
                  disabled={Boolean(imageBusy)}
                  onClick={() => void runImageAction(item.label)}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-black text-ink">
                      {isItemBusy ? (
                        <Loader2 aria-hidden="true" size={18} className="animate-spin text-moss" />
                      ) : (
                        <Icon aria-hidden="true" className={cn(isSelected ? "text-moss" : "text-graphite")} size={18} />
                      )}
                      {item.label}
                    </span>
                    {isSelected ? <CheckCircle2 aria-hidden="true" className="text-moss" size={18} /> : null}
                  </div>
                  <span className="mt-1 text-xs text-graphite">{item.desc}</span>
                </button>
              );
            })}
          </div>

          {/* Image Result Area */}
          <div className="mt-6 rounded-card border border-ink/10 bg-paper p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <span className={cn("size-3 rounded-full", imageBusy ? "bg-amber-500 animate-ping" : "bg-moss")} />
                <p className="font-black text-ink">
                  {imageResult ? imageResult.action : activeImageAction} Result
                </p>
              </div>
              {imageResult && !imageBusy ? (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => speak(imageResult.text)}
                    aria-label="Read extracted text and explanation aloud"
                  >
                    <Volume2 aria-hidden="true" size={15} />
                    Listen
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(imageResult.text);
                      setCopiedImageResult(true);
                      setTimeout(() => setCopiedImageResult(false), 2000);
                    }}
                    aria-label="Copy result"
                  >
                    {copiedImageResult ? (
                      <>
                        <Check aria-hidden="true" size={15} className="text-moss" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy aria-hidden="true" size={15} />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>

            <div className="mt-4 min-h-32 text-base leading-8 text-graphite">
              {imageBusy ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <Loader2 aria-hidden="true" size={32} className="animate-spin text-moss" />
                  <p className="font-black text-ink">Extracting & analyzing content...</p>
                  <p className="text-xs text-graphite">
                    Generating {activeImageAction} for {uploadedImage?.name}
                  </p>
                </div>
              ) : imageResult ? (
                <ReadingContent
                  text={imageResult.text}
                  label={`Extracted image information for ${imageResult.action}`}
                />
              ) : (
                <div className="py-6 text-center">
                  <p className="font-bold text-ink">No image analyzed yet.</p>
                  <p className="mt-1 text-sm text-graphite">
                    Upload an image or scanned document on the left. Adaptiva will automatically extract all readable text and display the adapted explanation here based on your chosen option.
                  </p>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </section>
    </div>
  );
}
