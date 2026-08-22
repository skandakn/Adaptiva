"use client";

import {
  BookOpen,
  CheckCircle2,
  FileImage,
  BarChart2,
  Languages,
  ListChecks,
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
    result.includes("API key is invalid")
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
    return `Uploaded image: ${filename}\n\nI could not read clear text from this image locally. Try a sharper scan, crop closer to the document, or add OpenAI quota for full image understanding.`;
  }

  const lines = extractedText.split("\n");
  const mainText = lines.slice(0, 6).join("\n");

  if (action === "Example") {
    return `Uploaded image: ${filename}\n\nText found:\n${mainText}\n\nExample:\nThink of this scanned document as a small note. The important information is the readable text above, so use those lines as the main facts from the image.`;
  }

  if (action === "Visual explanation") {
    return `Uploaded image: ${filename}\n\nVisible text found:\n${mainText}\n\nVisual explanation:\nThe image appears to contain a scanned document. Focus on the central document area and read the extracted text as the key information.`;
  }

  if (action === "Step-by-step") {
    return `Uploaded image: ${filename}\n\nStep-by-step:\n${lines.map((line, index) => `${index + 1}. ${line}`).join("\n")}`;
  }

  return `Uploaded image: ${filename}\n\nSimple explanation:\n${mainText}`;
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
  const [imageResult, setImageResult] = useState<ImageResult | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ name: string; dataUrl: string } | null>(null);
  const [imageBusy, setImageBusy] = useState<ImageAdaptAction | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const pendingImageActionRef = useRef<ImageAdaptAction | null>(null);
  const sourceText = material?.original_content ?? featuredLesson.original;
  const materialTitle = material?.title ?? featuredLesson.title;
  const courseLabel = material?.description ?? featuredLesson.course;
  const displayedText = translatedContent[mode] ?? (mode === "Original" ? sourceText : adapted);
  const displayedImageResult =
    imageResult ??
    (uploadedImage
      ? {
          action: "Image uploaded" as const,
          text: `Uploaded image: ${uploadedImage.name}\n\nPress Simple explanation, Example, Visual explanation, or Step-by-step to show information from this image.`
        }
      : null);
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
      setUploadedImage({ name: file.name, dataUrl });
      const pendingAction = pendingImageActionRef.current;
      pendingImageActionRef.current = null;
      setImageResult({
        action: pendingAction ?? "Simple explanation",
        text: pendingAction
          ? `${pendingAction} is reading ${file.name}...`
          : `Uploaded image: ${file.name}\n\nChoose a button to analyze this image or scanned document.`
      });
      if (pendingAction) void runImageAction(pendingAction, { name: file.name, dataUrl });
    };
    reader.onerror = () => {
      pendingImageActionRef.current = null;
      setImageResult({
        action: "Simple explanation",
        text: "Could not read this image. Try another file."
      });
    };
    reader.readAsDataURL(file);
  }

  async function runImageAction(action: ImageAdaptAction, selectedImage = uploadedImage) {
    if (!selectedImage) {
      pendingImageActionRef.current = action;
      setImageResult({
        action,
        text: "Choose an image or scanned document, then Adaptiva will show this result here."
      });
      imageInputRef.current?.click();
      return;
    }

    setImageBusy(action);
    setImageResult({
      action,
      text: `${action} is reading ${selectedImage.name}...`
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
      const payload = (await response.json()) as { result?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(payload.error?.message ?? "Image explanation failed.");
      const apiResult = payload.result?.trim() || "No explanation was returned for this image.";
      if (shouldUseLocalOcr(apiResult)) {
        setImageResult({
          action,
          text: `${apiResult}\n\nTrying local OCR on ${selectedImage.name}...`
        });
        const tesseract = (await import("tesseract.js")) as typeof import("tesseract.js") & {
          default?: typeof import("tesseract.js");
        };
        const recognize = tesseract.recognize ?? tesseract.default?.recognize;
        if (!recognize) throw new Error("Local OCR is not available in this browser.");
        const ocrResult = await recognize(selectedImage.dataUrl, "eng");
        setImageResult({
          action,
          text: formatOcrResult(action, selectedImage.name, ocrResult.data.text)
        });
        return;
      }
      setImageResult({
        action,
        text: apiResult
      });
    } catch (error) {
      setImageResult({
        action,
        text: error instanceof Error ? error.message : "Could not explain the uploaded image."
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
        </div>
        <Panel className="w-full max-w-sm p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Focus recovery</p>
          <h2 className="mt-2 text-xl font-black text-ink">Welcome back.</h2>
          <ul className="mt-3 space-y-2 text-sm font-bold text-graphite">
            <li>DNA opens before it is copied.</li>
            <li>Matching bases help create the new strand.</li>
            <li>Two complete DNA molecules are formed.</li>
          </ul>
        </Panel>
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
            <span className="rounded-card bg-cloud px-3 py-2 text-xs font-black text-moss">
              {language}
            </span>
          </div>
          {mode === "Focus" ? (
            <div className="mt-5">
              <FocusMode concepts={focusConcepts} explanation={translatedContent.Focus} />
            </div>
          ) : mode === "Audio" ? (
            <div className="mt-5">
              <AudioPlayer text={translatedContent.Audio ?? adapted} language={language} />
            </div>
          ) : mode === "Visual" ? (
            <div className="mt-5">
              <MindMap key={`${language}-${mindMap.id}`} node={mindMap} language={language} />
            </div>
          ) : (
            <div className="mt-5 rounded-card bg-paper p-5 text-xl leading-10 text-ink">
              <ReadingContent text={displayedText} />
            </div>
          )}
          <p className="mt-4 min-h-6 text-sm font-bold text-moss">{status}</p>
        </Panel>
      </div>

      {preferences.enabled ? (
        <section
          className="mt-6 rounded-card border border-moss/25 bg-mint/10 p-5 shadow-soft"
          aria-label="Reading Mode transformed lesson"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Reading Mode Transformation</p>
              <h2 className="mt-2 text-2xl font-black text-ink">The lesson is chunked into a simpler reading path.</h2>
            </div>
            <span className="rounded-card bg-white px-3 py-2 text-xs font-black text-moss">
              {getReadingFontLabel(preferences.font)} active
            </span>
          </div>
          <div className="mt-4 rounded-card bg-white p-5">
            <ReadingContent text={readingTransform} />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <Button type="button" variant="secondary" onClick={() => speak(readingTransform)}>
              <Volume2 aria-hidden="true" size={17} />
              Listen
            </Button>
            <Button type="button" variant="secondary" onClick={() => void runAction("Simplify")}>
              Explain simply
            </Button>
            <Button type="button" variant="secondary" onClick={() => void runAction("Explain Step-by-Step")}>
              Break into steps
            </Button>
          </div>
        </section>
      ) : null}

      <section className="mt-6 rounded-card border border-ink/10 bg-white p-5 shadow-soft" aria-label="Adaptive actions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
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

      <section className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
        <Panel>
          <div className="flex items-start gap-3">
            <FileImage aria-hidden="true" className="text-moss" size={28} />
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
                Image / Scanned Document
              </p>
              <h2 className="mt-2 text-2xl font-black text-ink">OCR-ready input</h2>
            </div>
          </div>
          <label className="mt-5 grid min-h-24 cursor-pointer place-items-center rounded-card border border-dashed border-moss/45 bg-mint/10 p-4 text-center font-black text-moss">
            {uploadedImage ? uploadedImage.name : "Upload image"}
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
              <img src={uploadedImage.dataUrl} alt="" className="max-h-56 w-full object-contain" />
            </div>
          ) : null}
          <Button
            className="mt-4 w-full"
            type="button"
            variant="secondary"
            onClick={() => void runImageAction("Simple explanation")}
          >
            <ScanText aria-hidden="true" size={18} />
            Read uploaded image
          </Button>
        </Panel>
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Uploaded Image Support</p>
          <h2 className="mt-2 text-2xl font-black text-ink">
            Choose how Adaptiva should explain the uploaded image.
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(["Simple explanation", "Example", "Visual explanation", "Step-by-step"] as ImageAdaptAction[]).map((item) => (
              <button
                key={item}
                type="button"
                className="flex min-h-14 items-center gap-2 rounded-card border border-ink/10 bg-paper px-4 text-left font-black text-ink transition hover:border-moss/40 hover:bg-cloud disabled:cursor-not-allowed disabled:opacity-60"
                disabled={Boolean(imageBusy)}
                onClick={() => void runImageAction(item)}
              >
                <CheckCircle2 aria-hidden="true" className="text-moss" size={18} />
                {imageBusy === item ? "Reading image..." : item}
              </button>
            ))}
          </div>
          <div className="mt-5 min-h-28 rounded-card bg-paper p-4 text-sm leading-7 text-graphite">
            <p className="font-black text-ink">{displayedImageResult?.action ?? "Image result"}</p>
            <p className="mt-2 whitespace-pre-line">
              {displayedImageResult?.text ?? "Upload an image or scanned document first. Then use these buttons to get information from that uploaded file."}
            </p>
          </div>
        </Panel>
      </section>
    </div>
  );
}
