"use client";

import {
  AlertCircle,
  BookOpen,
  ChevronDown,
  Layers,
  RotateCcw,
  Save,
  Sparkles,
  Volume2,
  ZoomIn,
  ZoomOut
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { FigureRenderer } from "@/components/learning/figure/figure-renderer";
import { ReadingContent } from "@/components/reading/reading-content";
import { useReadingMode } from "@/components/reading/reading-mode-provider";
import { Button } from "@/components/ui/button";
import { Badge, Panel } from "@/components/ui/panel";
import { demoFigures } from "@/lib/demo-data";
import type { FigureSpec, FigureType } from "@/lib/types";
import { cn } from "@/lib/utils";

// ─── Quick-start examples ────────────────────────────────────────────────────
const EXAMPLES = [
  { label: "DNA Replication", text: "DNA replication is a semi-conservative biological process in which the double-stranded DNA molecule unwinds and each original strand serves as a template for the synthesis of a complementary strand. Enzymes such as helicase, primase, DNA polymerase, and ligase coordinate the copying process so genetic information can be transmitted accurately before cell division." },
  { label: "Water Cycle", text: "The water cycle describes how water evaporates from the surface of the earth, rises into the atmosphere, cools and condenses into clouds, and falls back to the surface as precipitation. Water then flows into rivers and oceans, where the cycle begins again." },
  { label: "Photosynthesis", text: "Photosynthesis is the process by which plants use sunlight, water and carbon dioxide to produce glucose and oxygen. Chlorophyll in the leaves captures the light energy needed to drive the chemical reaction." },
  { label: "Mitosis vs Meiosis", text: "Mitosis produces two genetically identical daughter cells for growth and repair. Meiosis produces four genetically unique cells used in sexual reproduction. Mitosis involves one division while meiosis involves two divisions, reducing chromosomes from 46 to 23." }
];

const FIGURE_TYPE_LABELS: Record<FigureType, string> = {
  process: "Process Diagram",
  flowchart: "Flowchart",
  "concept-map": "Concept Map",
  cycle: "Cycle Diagram",
  comparison: "Comparison",
  timeline: "Timeline",
  system: "System Diagram",
  annotated: "Annotated Figure",
  infographic: "Educational Infographic"
};

// ─── Generation pipeline stages ──────────────────────────────────────────────
type Stage = "idle" | "understanding" | "extracting" | "selecting" | "building" | "done" | "error";

const STAGE_LABELS: Record<Stage, string> = {
  idle: "",
  understanding: "Understanding your content…",
  extracting: "Extracting key concepts…",
  selecting: "Selecting the best figure type…",
  building: "Building your figure…",
  done: "Figure ready.",
  error: "Something went wrong."
};

// ─── Component ───────────────────────────────────────────────────────────────
export function FigureWorkspace({ initialContent }: { initialContent?: string }) {
  const { speak, speech, stopSpeech } = useReadingMode();
  const [content, setContent] = useState(initialContent ?? "");
  const [stage, setStage] = useState<Stage>("idle");
  const [spec, setSpec] = useState<FigureSpec | null>(null);
  const [activeTab, setActiveTab] = useState<"visual" | "text">("visual");
  const [savedStatus, setSavedStatus] = useState<string | null>(null);
  const figureReadText = spec?.explanation.join("\n") ?? "";
  const readingAloud = Boolean(figureReadText && speech.text === figureReadText.trim() && speech.isSpeaking);

  // Pre-populate from query string (coming from /learn workspace)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pre = params.get("content");
    if (pre && !initialContent) setContent(decodeURIComponent(pre));
  }, [initialContent]);

  // ── Pipeline simulation with real delay ──────────────────────────────────
  const generate = useCallback(
    async (overrideContent?: string) => {
      const text = (overrideContent ?? content).trim();
      if (!text) return;

      setSpec(null);
      setSavedStatus(null);

      const stages: Stage[] = ["understanding", "extracting", "selecting", "building"];
      for (const s of stages) {
        setStage(s);
        await new Promise<void>((r) => setTimeout(r, 380));
      }

      try {
        const response = await fetch("/api/figure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: text,
            save: false
          })
        });

        const payload = (await response.json()) as { figure?: FigureSpec; error?: { message?: string } };
        if (!response.ok || !payload.figure) throw new Error(payload.error?.message ?? "Generation failed.");

        setSpec(payload.figure);
        setActiveTab("visual");
        setStage("done");
      } catch {
        setStage("error");
      }
    },
    [content]
  );

  const handleSimplify = () => {
    if (!spec) return;
    setSpec((prev) => {
      if (!prev) return prev;
      const maxNodes = 4;
      const keptIds = new Set(prev.nodes.slice(0, maxNodes).map((n) => n.id));
      return {
        ...prev,
        complexity: "simple",
        nodes: prev.nodes.slice(0, maxNodes),
        relationships: prev.relationships.filter((r) => keptIds.has(r.from) && keptIds.has(r.to)),
        explanation: prev.explanation.slice(0, 4)
      };
    });
    setActiveTab("text");
  };

  const handleRegenerate = () => {
    void generate();
  };

  const handleReadFigure = () => {
    if (!spec) return;
    if (readingAloud) {
      stopSpeech();
      return;
    }
    speak(figureReadText);
  };

  const handleSave = async () => {
    if (!spec) return;
    try {
      const response = await fetch("/api/figure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, save: true })
      });
      setSavedStatus(response.ok ? "Figure saved." : "Could not save — demo mode active.");
    } catch {
      setSavedStatus("Saved locally in demo mode.");
    }
  };

  const isGenerating = stage !== "idle" && stage !== "done" && stage !== "error";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <Badge>Text-to-Figure · TTF</Badge>
          <h1 className="mt-4 text-balance text-4xl font-black leading-tight text-ink sm:text-5xl">
            Turn complex information into<br />something you can see.
          </h1>
          <ReadingContent
            className="mt-4 max-w-2xl text-lg leading-8 text-graphite"
            text="Adaptiva transforms educational text into clear, contextual visual explanations. Figures are an additional way to understand concepts; choose whatever works best for you."
          />
        </div>
        <Panel className="w-full max-w-xs p-4" as="div">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">AI-generated visualization</p>
          <p className="mt-2 text-sm font-bold text-graphite leading-6">
            Figures are generated from your content. Verify against your source material.
          </p>
        </Panel>
      </div>

      {/* ── Input panel ──────────────────────────────────────────────────── */}
      <Panel className="mt-8" as="div">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Your content</p>
            <h2 className="mt-1 text-xl font-black text-ink">Paste educational text or topic</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="rounded-card border border-ink/10 bg-paper px-3 py-1.5 text-xs font-black text-graphite transition hover:border-moss/40 hover:bg-cloud hover:text-ink"
                onClick={() => setContent(ex.text)}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <textarea
          id="ttf-input"
          className="mt-4 min-h-36 w-full resize-y rounded-card border border-ink/12 bg-paper px-4 py-3 text-base leading-8 text-ink placeholder:text-graphite/60 focus-visible:border-moss focus-visible:outline-none focus-visible:ring-0"
          placeholder="Paste your lesson, paragraph, or topic. Adaptiva will choose the best figure format."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-label="Educational content to convert into a figure"
          rows={5}
        />

        <div className="mt-4 flex justify-center sm:justify-end">
          <Button
            id="create-figure-btn"
            disabled={isGenerating || !content.trim()}
            onClick={() => void generate()}
          >
            <Sparkles aria-hidden="true" size={16} />
            {isGenerating ? "Generating…" : "Create Figure"}
          </Button>
        </div>
      </Panel>

      {/* ── Pipeline animation ────────────────────────────────────────────── */}
      {(isGenerating || stage === "error") && (
        <Panel className="mt-6" as="div">
          <div className="flex items-center gap-3">
            {stage === "error" ? (
              <AlertCircle aria-hidden="true" className="text-coral" size={20} />
            ) : (
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-moss border-t-transparent"
              />
            )}
            <p className="font-black text-ink">{STAGE_LABELS[stage]}</p>
          </div>
          {/* Stage dots */}
          {stage !== "error" && (
            <div className="mt-4 flex gap-2" role="progressbar" aria-label="Generation progress">
              {(["understanding", "extracting", "selecting", "building"] as const).map((s) => (
                <div
                  key={s}
                  className={cn(
                    "h-2 flex-1 rounded-full transition-colors duration-500",
                    stage === s || ["extracting", "selecting", "building"].indexOf(stage) >= ["extracting", "selecting", "building"].indexOf(s)
                      ? "bg-moss"
                      : "bg-cloud"
                  )}
                />
              ))}
            </div>
          )}
        </Panel>
      )}

      {/* ── Generated figure ──────────────────────────────────────────────── */}
      {spec && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          {/* Main figure panel */}
          <Panel as="div">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Your Figure</p>
                <h2 className="mt-1 text-2xl font-black text-ink">{spec.title}</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="rounded-card bg-cloud px-3 py-1 text-xs font-black text-moss">
                    {FIGURE_TYPE_LABELS[spec.type]}
                  </span>
                  <span className="rounded-card bg-paper px-3 py-1 text-xs font-black text-graphite">
                    {spec.topic}
                  </span>
                </div>
              </div>
              <Layers aria-hidden="true" className="text-moss" size={28} />
            </div>

            {/* Tabs */}
            <div className="mt-5 flex gap-2" role="tablist" aria-label="Figure view">
              {(["visual", "text"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  id={`ttf-tab-${tab}`}
                  aria-selected={activeTab === tab}
                  aria-controls={`ttf-panel-${tab}`}
                  className={cn(
                    "min-h-10 rounded-card border px-4 text-sm font-black capitalize transition",
                    activeTab === tab
                      ? "border-ink bg-ink text-white"
                      : "border-ink/10 bg-white text-graphite hover:bg-cloud"
                  )}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "visual" ? "Visual" : "Text Explanation"}
                </button>
              ))}
            </div>

            {/* Visual tab */}
            <div
              id="ttf-panel-visual"
              role="tabpanel"
              aria-labelledby="ttf-tab-visual"
              hidden={activeTab !== "visual"}
              className="mt-5"
            >
              <FigureRenderer spec={spec} />
            </div>

            {/* Text explanation tab */}
            <div
              id="ttf-panel-text"
              role="tabpanel"
              aria-labelledby="ttf-tab-text"
              hidden={activeTab !== "text"}
              className="mt-5"
            >
              <div className="rounded-card bg-paper p-5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Accessible text explanation</p>
                <ReadingContent className="mt-4 text-base leading-8 text-ink" text={figureReadText} />
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-card border border-ink/10 bg-paper px-3 py-2 text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={handleReadFigure}
                aria-pressed={readingAloud}
              >
                <Volume2 aria-hidden="true" size={16} />
                {readingAloud ? "Stop Reading" : "Read Figure"}
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-card border border-ink/10 bg-paper px-3 py-2 text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={handleSimplify}
              >
                <ChevronDown aria-hidden="true" size={16} />
                Explain Simply
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-card border border-ink/10 bg-paper px-3 py-2 text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={() => setActiveTab("text")}
              >
                <BookOpen aria-hidden="true" size={16} />
                Step-by-Step
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-card border border-ink/10 bg-paper px-3 py-2 text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                <RotateCcw aria-hidden="true" size={16} />
                Regenerate
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-card border border-ink/10 bg-paper px-3 py-2 text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                onClick={() => void handleSave()}
              >
                <Save aria-hidden="true" size={16} />
                Save
              </button>
            </div>

            {savedStatus && (
              <p className="mt-3 text-sm font-bold text-moss">{savedStatus}</p>
            )}
          </Panel>

          {/* Sidebar */}
          <div className="grid gap-6 self-start">
            {/* Source traceability */}
            <Panel as="div">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Based on your content</p>
              <h3 className="mt-2 text-lg font-black text-ink">Key concepts extracted</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {spec.sourceConcepts.map((concept) => (
                  <span
                    key={concept}
                    className="rounded-card border border-moss/20 bg-mint/10 px-3 py-1 text-xs font-black text-moss"
                  >
                    {concept}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-card bg-paper p-3">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-graphite">Source excerpt</p>
                <ReadingContent className="mt-2 line-clamp-4 text-sm leading-7 text-graphite" text={spec.sourceText} />
              </div>
              <p className="mt-3 text-xs font-bold text-graphite/80">
                AI-generated visualization — verify against the source material.
              </p>
            </Panel>

            {/* Quick demos */}
            <Panel as="div">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Demo figures</p>
              <h3 className="mt-2 text-lg font-black text-ink">Try an example</h3>
              <div className="mt-3 grid gap-2">
                {demoFigures.map((demo) => (
                  <button
                    key={demo.id}
                    type="button"
                    className="flex items-center gap-2 rounded-card border border-ink/10 bg-paper px-4 py-3 text-left text-sm font-black text-ink transition hover:border-moss/40 hover:bg-cloud"
                    onClick={() => {
                      setContent(demo.sourceText);
                      setSpec(demo);
                      setStage("done");
                      setActiveTab("visual");
                    }}
                  >
                    <Sparkles aria-hidden="true" className="text-moss" size={16} />
                    {demo.title}
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      )}

      {/* ── Empty state / prompt ──────────────────────────────────────────── */}
      {stage === "idle" && !spec && (
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {[
            { icon: ZoomIn, title: "Concept maps", body: "See how ideas connect and relate to each other." },
            { icon: Layers, title: "Process diagrams", body: "Follow steps and sequences in order." },
            { icon: ZoomOut, title: "Cycle diagrams", body: "Understand repeating natural or biological processes." }
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Panel key={card.title} as="div" className="flex flex-col gap-3">
                <Icon aria-hidden="true" className="text-moss" size={28} />
                <h3 className="text-xl font-black text-ink">{card.title}</h3>
                <ReadingContent className="text-sm leading-7 text-graphite" text={card.body} />
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
