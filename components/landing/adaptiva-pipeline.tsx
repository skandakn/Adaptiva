"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

// ─── Data ────────────────────────────────────────────────────────────────────

const INPUTS = [
  { emoji: "📄", label: "PDF", delay: 0 },
  { emoji: "🎙", label: "Lecture", delay: 0.2 },
  { emoji: "🎥", label: "Video", delay: 0.4 },
  { emoji: "📝", label: "Text", delay: 0.6 },
];

const PROCESSING_STAGES = ["Understanding", "Simplifying", "Personalizing"];

const OUTPUTS = [
  { emoji: "📖", label: "Simplified Reading", delay: 0, href: null, highlight: false },
  { emoji: "🧠", label: "Step-by-Step", delay: 0.15, href: null, highlight: false },
  { emoji: "🗺", label: "Visual Figure", delay: 0.30, href: "/learn", highlight: true },
  { emoji: "🔊", label: "Read Aloud", delay: 0.45, href: null, highlight: false },
  { emoji: "🔤", label: "Personalized Reading", delay: 0.60, href: null, highlight: false },
];

// Cycle duration in ms — must match CSS total animation end time
const CYCLE_MS = 9000;

// ─────────────────────────────────────────────────────────────────────────────

export function AdaptivaPipeline() {
  const [stageIndex, setStageIndex] = useState(0);
  const [cycleKey, setCycleKey] = useState(0); // incrementing resets CSS animations
  const [prefersReduced, setPrefersReduced] = useState(false);
  const cycleRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stageRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = () => setPrefersReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Restart CSS animation cycle by bumping cycleKey
  useEffect(() => {
    if (prefersReduced) return;
    cycleRef.current = setInterval(() => {
      setCycleKey((k) => k + 1);
    }, CYCLE_MS);
    return () => {
      if (cycleRef.current) clearInterval(cycleRef.current);
    };
  }, [prefersReduced]);

  // Cycle processing stage labels independently
  useEffect(() => {
    if (prefersReduced) return;
    stageRef.current = setInterval(() => {
      setStageIndex((i) => (i + 1) % PROCESSING_STAGES.length);
    }, 1400);
    return () => {
      if (stageRef.current) clearInterval(stageRef.current);
    };
  }, [prefersReduced]);

  return (
    <section
      className="bg-paper py-14"
      aria-label="Adaptiva accessibility pipeline"
    >
      {/* Accessible description for screen readers */}
      <p className="sr-only">
        Adaptiva transforms documents, lectures, videos and text using AI into
        personalized learning formats including simplified reading,
        step-by-step explanations, visual figures and audio.
      </p>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <div className="mb-8 text-center">
          <span className="inline-flex items-center rounded-card border border-ink/10 bg-cloud px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-moss">
            How Adaptiva Works
          </span>
          <h2 className="mt-4 text-2xl font-black text-ink sm:text-3xl">
            Any content. Every learner.
          </h2>
          <p className="mt-2 text-base text-graphite">
            Your content enters. Personalized learning exits.
          </p>
        </div>

        {/* ── Desktop pipeline (3 columns) ── */}
        <div
          className="hidden lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8"
          aria-hidden="true"
        >
          {/* INPUTS */}
          <div key={`inputs-${cycleKey}`} className="grid grid-cols-2 gap-3">
            {INPUTS.map((item) => (
              <div
                key={item.label}
                className={`pipeline-card pipeline-input rounded-card border border-ink/10 bg-white px-4 py-4 shadow-sm${
                  prefersReduced ? " !opacity-100 !translate-y-0" : ""
                }`}
                style={
                  prefersReduced
                    ? undefined
                    : ({ "--delay": `${item.delay}s` } as React.CSSProperties)
                }
              >
                <span className="block text-2xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="mt-1.5 block text-xs font-black text-ink">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* CENTER — AI processing box */}
          <div className="flex flex-col items-center gap-3 px-2">
            {/* Arrow top */}
            <DashedArrow />

            <div
              className={`rounded-card border-2 border-moss bg-ink px-6 py-5 text-center shadow-lift${
                prefersReduced ? "" : " pipeline-pulse"
              }`}
            >
              <p className="text-xs font-black uppercase tracking-[0.14em] text-mint">
                ✨ ADAPTIVA AI
              </p>
              <div className="mt-3 flex flex-col gap-0.5">
                {["UNDERSTAND", "SIMPLIFY", "ADAPT"].map((stage, i, arr) => (
                  <div key={stage} className="flex flex-col items-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.12em] text-white/50">
                      {stage}
                    </span>
                    {i < arr.length - 1 && (
                      <span className="text-[10px] text-white/25">↓</span>
                    )}
                  </div>
                ))}
              </div>
              <p
                className="mt-3 text-xs font-black text-mint"
                key={`stage-${stageIndex}`}
                style={{ animation: prefersReduced ? "none" : "pipeline-fade-up 0.4s ease forwards" }}
              >
                {prefersReduced
                  ? "Processing…"
                  : `✨ ${PROCESSING_STAGES[stageIndex]}…`}
              </p>
            </div>

            {/* Arrow bottom */}
            <DashedArrow />
          </div>

          {/* OUTPUTS */}
          <div key={`outputs-${cycleKey}`} className="grid grid-cols-1 gap-3">
            {OUTPUTS.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`pipeline-card pipeline-output flex items-center gap-3 rounded-card border px-4 py-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-lift${
                    item.highlight
                      ? " border-moss/40 bg-mint/10 text-moss"
                      : " border-ink/10 bg-white text-ink"
                  }${prefersReduced ? " !opacity-100 !translate-y-0" : ""}`}
                  style={
                    prefersReduced
                      ? undefined
                      : ({ "--delay": `${item.delay}s` } as React.CSSProperties)
                  }
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-black">{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto rounded bg-moss/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-moss">
                      New
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className={`pipeline-card pipeline-output flex items-center gap-3 rounded-card border border-ink/10 bg-white px-4 py-3 shadow-sm text-ink${
                    prefersReduced ? " !opacity-100 !translate-y-0" : ""
                  }`}
                  style={
                    prefersReduced
                      ? undefined
                      : ({ "--delay": `${item.delay}s` } as React.CSSProperties)
                  }
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-black">{item.label}</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Bottom label — desktop */}
        <div className="mt-6 hidden justify-center lg:flex" aria-hidden="true">
          <div className="rounded-card border border-moss/25 bg-mint/10 px-6 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
              ↑ Personalized Learning — built around each learner&apos;s needs
            </p>
          </div>
        </div>

        {/* ── Mobile pipeline (vertical stack) ── */}
        <div className="flex flex-col items-center gap-4 lg:hidden">
          {/* Inputs */}
          <div className="grid w-full grid-cols-2 gap-3">
            {INPUTS.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-2 rounded-card border border-ink/10 bg-white px-3 py-3 shadow-sm"
              >
                <span className="text-xl" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="text-xs font-black text-ink">{item.label}</span>
              </div>
            ))}
          </div>

          <MobileArrow />

          {/* AI box */}
          <div className="rounded-card border-2 border-moss bg-ink px-8 py-5 text-center shadow-lift">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-mint">
              ✨ ADAPTIVA AI
            </p>
            <p className="mt-1 text-xs text-white/60">
              UNDERSTAND · SIMPLIFY · ADAPT
            </p>
            <p className="mt-2 text-xs font-black text-mint">
              ✨ {PROCESSING_STAGES[stageIndex]}…
            </p>
          </div>

          <MobileArrow />

          {/* Outputs */}
          <div className="grid w-full gap-2">
            {OUTPUTS.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-card border px-4 py-3 shadow-sm transition hover:-translate-y-0.5${
                    item.highlight
                      ? " border-moss/40 bg-mint/10 text-moss"
                      : " border-ink/10 bg-white text-ink"
                  }`}
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-black">{item.label}</span>
                  {item.highlight && (
                    <span className="ml-auto rounded bg-moss/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-moss">
                      New
                    </span>
                  )}
                </Link>
              ) : (
                <div
                  key={item.label}
                  className="flex items-center gap-3 rounded-card border border-ink/10 bg-white px-4 py-3 shadow-sm"
                >
                  <span className="text-xl" aria-hidden="true">
                    {item.emoji}
                  </span>
                  <span className="text-xs font-black text-ink">{item.label}</span>
                </div>
              )
            )}
          </div>

          {/* Bottom label */}
          <div className="mt-2 w-full rounded-card border border-moss/25 bg-mint/10 px-5 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">
              Personalized Learning
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DashedArrow() {
  return (
    <svg
      width="24"
      height="36"
      viewBox="0 0 24 36"
      fill="none"
      aria-hidden="true"
      className="text-moss/50"
    >
      <line
        x1="12"
        y1="0"
        x2="12"
        y2="26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <path
        d="M6 25 L12 33 L18 25"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileArrow() {
  return (
    <svg
      width="24"
      height="36"
      viewBox="0 0 24 36"
      fill="none"
      aria-hidden="true"
      className="text-moss/50"
    >
      <line
        x1="12"
        y1="0"
        x2="12"
        y2="26"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 3"
      />
      <path
        d="M6 25 L12 33 L18 25"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
