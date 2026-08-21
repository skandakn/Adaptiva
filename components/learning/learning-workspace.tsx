"use client";

import {
  BookOpen,
  CheckCircle2,
  FileImage,
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
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";
import type { LearningMode } from "@/lib/types";
import { simplifyText, translateContent } from "@/lib/ai-service";
import { cn } from "@/lib/utils";

const modes: LearningMode[] = ["Original", "Simplified", "Focus", "Audio", "Visual"];

const actions = [
  { label: "Simplify", icon: Sparkles },
  { label: "Explain Step-by-Step", icon: ListChecks },
  { label: "Read Aloud", icon: Volume2 },
  { label: "Summarize", icon: ScanText },
  { label: "Create Mind Map", icon: Map },
  { label: "Translate", icon: Languages },
  { label: "Ask AI", icon: MessageCircle }
];

export function LearningWorkspace() {
  const [mode, setMode] = useState<LearningMode>("Simplified");
  const [adapted, setAdapted] = useState(featuredLesson.simplified);
  const [status, setStatus] = useState("Demo lesson loaded.");
  const [language, setLanguage] = useState<"English" | "Kannada" | "Hindi">("English");
  const [imageResult, setImageResult] = useState<string | null>(null);

  async function runAction(action: string) {
    setStatus(`${action} is processing in demo mode...`);
    if (action === "Simplify") {
      setAdapted(await simplifyText(featuredLesson.original, "simple"));
      setMode("Simplified");
    }
    if (action === "Explain Step-by-Step") {
      setAdapted(featuredLesson.stepByStep.map((step, index) => `Step ${index + 1}: ${step}`).join("\n\n"));
      setMode("Simplified");
    }
    if (action === "Translate") {
      const nextLanguage = language === "English" ? "Kannada" : language === "Kannada" ? "Hindi" : "English";
      setLanguage(nextLanguage);
      setAdapted(await translateContent(nextLanguage));
      setMode("Simplified");
    }
    if (action === "Create Mind Map") {
      setMode("Visual");
    }
    if (action === "Read Aloud") {
      setMode("Audio");
    }
    if (action === "Ask AI") {
      setAdapted("Adaptiva noticed this concept may need another explanation.\n\nTry: a simple explanation, an example, a visual explanation, or step-by-step mode.");
    }
    if (action === "Summarize") {
      setAdapted("DNA replication copies genetic instructions before cell division. The DNA opens, matching bases are added, and two complete DNA molecules are created.");
    }
    setStatus(`${action} complete.`);
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
            Featured demo: {featuredLesson.course} / {featuredLesson.title}
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
              <h2 className="mt-2 text-2xl font-black text-ink">{featuredLesson.title}</h2>
            </div>
            <BookOpen aria-hidden="true" className="text-moss" size={28} />
          </div>
          <p className="mt-5 text-lg leading-9 text-graphite">{featuredLesson.original}</p>
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
              <FocusMode concepts={featuredLesson.keyConcepts} />
            </div>
          ) : mode === "Audio" ? (
            <div className="mt-5">
              <AudioPlayer text={adapted} />
            </div>
          ) : mode === "Visual" ? (
            <div className="mt-5">
              <MindMap node={featuredLesson.mindMap} />
            </div>
          ) : (
            <div className="mt-5 whitespace-pre-line rounded-card bg-paper p-5 text-xl leading-10 text-ink">
              {mode === "Original" ? featuredLesson.original : adapted}
            </div>
          )}
          <p className="mt-4 min-h-6 text-sm font-bold text-moss">{status}</p>
        </Panel>
      </div>

      <section className="mt-6 rounded-card border border-ink/10 bg-white p-5 shadow-soft" aria-label="Adaptive actions">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
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
