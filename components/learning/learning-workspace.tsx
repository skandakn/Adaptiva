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
import { useEffect, useState } from "react";
import { AdaptButton } from "@/components/learning/adapt-button";
import { AudioPlayer } from "@/components/learning/audio-player";
import { FocusMode } from "@/components/learning/focus-mode";
import { MindMap } from "@/components/learning/mind-map";
import { ReadingContent } from "@/components/reading/reading-content";
import { ReadingModeControls } from "@/components/reading/reading-mode-controls";
import { useReadingMode } from "@/components/reading/reading-mode-provider";
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";
import { getReadingFontLabel } from "@/lib/reading-mode";
import type { LearningMode, MindMapNode } from "@/lib/types";
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

function stringifyResult(result: unknown) {
  if (typeof result === "string") return result;
  if (Array.isArray(result)) return result.map((item, index) => `Step ${index + 1}: ${String(item)}`).join("\n\n");
  if (result && typeof result === "object") return JSON.stringify(result, null, 2);
  return "";
}

export function LearningWorkspace() {
  const { preferences, speak } = useReadingMode();
  const [mode, setMode] = useState<LearningMode>("Simplified");
  const [adapted, setAdapted] = useState(featuredLesson.simplified);
  const [material, setMaterial] = useState<Material | null>(null);
  const [mindMap, setMindMap] = useState<MindMapNode>(featuredLesson.mindMap);
  const [status, setStatus] = useState("Demo lesson loaded.");
  const [language, setLanguage] = useState<"English" | "Kannada" | "Hindi">("English");
  const [translatedContent, setTranslatedContent] = useState<TranslatedContent>({});
  const [imageResult, setImageResult] = useState<string | null>(null);
  const sourceText = material?.original_content ?? featuredLesson.original;
  const materialTitle = material?.title ?? featuredLesson.title;
  const courseLabel = material?.description ?? featuredLesson.course;
  const displayedText = translatedContent[mode] ?? (mode === "Original" ? sourceText : adapted);
  const readingTransform = materialTitle.toLowerCase().includes("photosynthesis")
    ? "Photosynthesis\n\nPlants use sunlight to make food.\n\nMain idea:\nSUNLIGHT\nPLANT\nFOOD"
    : `${materialTitle}\n\nA cell copies its DNA before it divides.\n\nMain idea:\nDNA OPENS\nMATCHING BASES JOIN\nTWO COPIES FORM`;

  function contentForMode(learningMode: LearningMode) {
    if (learningMode === "Original") return sourceText;
    if (learningMode === "Focus") return featuredLesson.keyConcepts.join("\n");
    if (learningMode === "Visual") {
      const labels = (node: MindMapNode): string[] => [node.label, ...(node.children?.flatMap(labels) ?? [])];
      return labels(mindMap).join("\n");
    }
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
      const nextLanguage = action === "Translate" ? (language === "English" ? "Kannada" : language === "Kannada" ? "Hindi" : "English") : language;
      const response = await fetch("/api/adapt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: apiAction,
          text: action === "Translate" ? contentForMode(mode) : sourceText,
          language: nextLanguage,
          material_id: material?.id,
          save_as_note: false
        })
      });
      const payload = (await response.json()) as AdaptResponse;
      if (!response.ok) throw new Error(payload.error?.message ?? "Adaptation failed.");

      if (apiAction === "translate") {
        setLanguage(nextLanguage);
        setTranslatedContent((current) => ({ ...current, [mode]: stringifyResult(payload.result) }));
      } else if (apiAction === "mind-map" && payload.result && typeof payload.result === "object" && "label" in payload.result) {
        setMindMap(payload.result as MindMapNode);
        setMode("Visual");
      } else {
        setAdapted(stringifyResult(payload.result));
        setMode("Simplified");
      }
      setStatus(`${action} complete.`);
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

      <div className="mt-6">
        <ReadingModeControls textToRead={displayedText} />
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
              <FocusMode concepts={featuredLesson.keyConcepts} explanation={translatedContent.Focus} />
            </div>
          ) : mode === "Audio" ? (
            <div className="mt-5">
              <AudioPlayer text={translatedContent.Audio ?? adapted} />
            </div>
          ) : mode === "Visual" ? (
            <div className="mt-5">
              {translatedContent.Visual && (
                <p className="mb-4 whitespace-pre-line rounded-card bg-paper p-4 text-sm leading-7 text-graphite">
                  {translatedContent.Visual}
                </p>
              )}
              <MindMap node={mindMap} />
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
            Upload image
            <input
              className="sr-only"
              type="file"
              accept="image/*"
              onChange={() =>
                setImageResult(
                  "Extracted text: DNA replication creates two identical DNA molecules before cell division.\n\nSimplified: A cell copies its DNA so each new cell receives instructions."
                )
              }
            />
          </label>
          <Button className="mt-4 w-full" type="button" variant="secondary" onClick={() => setImageResult("Mock OCR fallback extracted the sample DNA replication paragraph and prepared it for simplification.")}>
            <ScanText aria-hidden="true" size={18} />
            Use Mock OCR
          </Button>
        </Panel>
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Adaptive Difficulty</p>
          <h2 className="mt-2 text-2xl font-black text-ink">Adaptiva noticed this concept may need another explanation.</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {["Simple explanation", "Example", "Visual explanation", "Step-by-step"].map((item) => (
              <button
                key={item}
                type="button"
                className="flex min-h-14 items-center gap-2 rounded-card border border-ink/10 bg-paper px-4 text-left font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={() => void runAction(item.includes("Step") ? "Explain Step-by-Step" : "Simplify")}
              >
                <CheckCircle2 aria-hidden="true" className="text-moss" size={18} />
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 min-h-28 whitespace-pre-line rounded-card bg-paper p-4 text-sm leading-7 text-graphite">
            {imageResult ?? "Upload a scanned page or use the mock OCR fallback to see extracted text, simplified text, audio, key points, and explanation."}
          </div>
        </Panel>
      </section>
    </div>
  );
}
