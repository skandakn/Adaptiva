"use client";

import { Brain, Clock, FileCheck2, Focus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ModeUsageChart, ProgressAreaChart } from "@/components/charts/learning-charts";
import { Panel } from "@/components/ui/panel";

type ProgressRow = {
  concept: string;
  status: string;
  mastery_level: number;
};

type SessionRow = {
  mode: string;
  duration_seconds: number | null;
  completed_at: string | null;
};

type ProgressPayload = {
  mode: "clerk" | "demo" | "supabase";
  progress: ProgressRow[];
  sessions: SessionRow[];
  charts?: {
    progressData?: { name: string; focus: number; concepts: number }[];
    modeUsageData?: { name: string; value: number }[];
  } | null;
  error?: { message?: string };
};

export function ProgressView() {
  const [payload, setPayload] = useState<ProgressPayload | null>(null);
  const [message, setMessage] = useState("Loading stored progress...");

  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch("/api/progress");
        const data = (await response.json()) as ProgressPayload;
        if (!response.ok) throw new Error(data.error?.message ?? "Could not load progress.");
        setPayload(data);
        setMessage(
          data.mode === "supabase"
            ? "Loaded from Supabase."
            : data.mode === "clerk"
              ? "Signed in with Clerk. Demo progress is active."
              : "Local demo progress is active."
        );
      } catch {
        setMessage("Progress persistence is unavailable, so demo data is shown.");
      }
    }

    void loadProgress();
  }, []);

  const data = useMemo(
    () =>
      payload ?? {
        mode: "demo" as const,
        progress: [],
        sessions: [],
        charts: null
      },
    [payload]
  );

  const totalSeconds = data.sessions.reduce((sum, session) => sum + (session.duration_seconds ?? 0), 0);
  const learningMinutes = Math.floor(totalSeconds / 60);
  const metrics = [
    { label: "Learning time", value: `${learningMinutes} minutes`, icon: Clock },
    { label: "Focus sessions", value: String(data.sessions.filter((session) => session.mode.toLowerCase().includes("focus")).length), icon: Focus },
    { label: "Concepts understood", value: String(data.progress.filter((item) => item.status === "understood" || item.status === "mastered").length), icon: Brain },
    { label: "Materials completed", value: String(data.sessions.filter((session) => session.completed_at).length), icon: FileCheck2 }
  ];

  const modeData = useMemo(() => {
    if (data.charts?.modeUsageData) return data.charts.modeUsageData;
    const counts = data.sessions.reduce<Record<string, number>>((acc, session) => {
      acc[session.mode] = (acc[session.mode] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [data]);

  const progressChart = data.charts?.progressData ?? [
    { name: "Saved", focus: Math.round(totalSeconds / 60), concepts: data.progress.length }
  ];

  const isEmpty = data.mode === "supabase" && data.progress.length === 0 && data.sessions.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Learning Progress</p>
      <h1 className="mt-4 text-5xl font-black text-ink">Progress without pressure.</h1>
      <p className="mt-3 max-w-3xl text-xl leading-8 text-graphite">
        The goal is understanding, not noisy gamification.
      </p>
      <p className="mt-2 text-sm font-bold text-moss">{message}</p>
      {isEmpty ? (
        <Panel className="mt-8">
          <h2 className="text-2xl font-black text-ink">No stored progress yet.</h2>
          <p className="mt-3 text-sm leading-7 text-graphite">
            Start an adaptive learning session or save a note to begin tracking progress.
          </p>
        </Panel>
      ) : (
        <>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <Panel key={metric.label}>
                  <Icon aria-hidden="true" className="text-moss" size={28} />
                  <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-graphite">
                    {metric.label}
                  </p>
                  <p className="mt-2 text-3xl font-black text-ink">{metric.value}</p>
                </Panel>
              );
            })}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Panel>
              <h2 className="text-2xl font-black text-ink">Focus time this week</h2>
              <div className="mt-4">
                <ProgressAreaChart data={progressChart} />
              </div>
            </Panel>
            <Panel>
              <h2 className="text-2xl font-black text-ink">Accessibility modes used</h2>
              <div className="mt-4">
                <ModeUsageChart data={modeData.length ? modeData : undefined} />
              </div>
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
