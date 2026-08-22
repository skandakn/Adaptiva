"use client";

import { ArrowRight, Brain, Clock, Flame, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccessibilityProfileCard } from "@/components/accessibility/profile-card";
import { ReadingContent } from "@/components/reading/reading-content";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";

type DashboardProfile = {
  reading_style?: string;
  focus_mode?: boolean;
  audio_enabled?: boolean;
  preferred_language?: string;
};

type DashboardPreferences = {
  step_by_step_support?: boolean;
};

type DashboardMaterial = {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  created_at: string;
};

type DashboardData = {
  mode: "clerk" | "demo" | "supabase";
  profile: DashboardProfile | null;
  preferences: DashboardPreferences | null;
  materials: DashboardMaterial[];
  stats: {
    learning_streak: string;
    focus_sessions: number;
    concepts_mastered?: number;
    concepts_understood?: number;
    recommended_mode: string;
  };
};

const fallbackData: DashboardData = {
  mode: "demo",
  profile: {
    reading_style: "OpenDyslexic",
    focus_mode: true,
    audio_enabled: true,
    preferred_language: "English"
  },
  preferences: { step_by_step_support: true },
  materials: [{
    id: featuredLesson.id,
    title: featuredLesson.title,
    description: featuredLesson.course,
    content_type: "text",
    created_at: new Date().toISOString()
  }],
  stats: {
    learning_streak: "1 day",
    focus_sessions: 1,
    concepts_mastered: 3,
    concepts_understood: 3,
    recommended_mode: "Step-by-step"
  }
};

export function DashboardView() {
  const [data, setData] = useState<DashboardData>(fallbackData);
  const [message, setMessage] = useState("Loading your saved workspace...");

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        const payload = (await response.json()) as DashboardData & { error?: { message?: string } };
        if (!response.ok) throw new Error(payload.error?.message ?? "Could not load dashboard.");
        setData(payload);
        setMessage(
          payload.mode === "supabase"
            ? "Loaded from Supabase."
            : payload.mode === "clerk"
              ? "Signed in with Clerk. Demo persistence is active."
              : "Local demo persistence is active."
        );
      } catch {
        setMessage("Using demo dashboard because persistence is unavailable.");
      }
    }

    void loadDashboard();
  }, []);

  const learningStreak = data.stats.learning_streak?.trim() || "1 day";
  const conceptsMastered = data.stats.concepts_mastered ?? data.stats.concepts_understood ?? 3;

  const stats = [
    { label: "Learning streak", value: learningStreak, icon: Flame },
    { label: "Focus sessions", value: String(data.stats.focus_sessions), icon: Clock },
    { label: "Concepts mastered", value: String(conceptsMastered), icon: Brain },
    { label: "Recommended mode", value: data.stats.recommended_mode, icon: Target }
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Student Dashboard</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-ink">Good to see you.</h1>
          <ReadingContent className="mt-3 text-xl leading-8 text-graphite" text="Your learning environment is adapted to you." />
          <p className="mt-2 text-sm font-bold text-moss">{message}</p>
        </div>
        <Button size="lg" asChild>
          <Link href="/learn">
            Start Adaptive Learning
            <ArrowRight aria-hidden="true" size={18} />
          </Link>
        </Button>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Panel key={stat.label}>
              <Icon aria-hidden="true" className="text-moss" size={28} />
              <p className="mt-4 text-sm font-black uppercase tracking-[0.14em] text-graphite">
                {stat.label}
              </p>
              <p className="mt-2 text-3xl font-black text-ink">{stat.value}</p>
            </Panel>
          );
        })}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Recent materials</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Biology - Cell & Molecular Systems</h2>
          <div className="mt-5 space-y-3">
            {data.materials.map((material) => (
              <Link
                key={material.id}
                href={`/learn?material=${material.id}`}
                className="flex min-h-20 items-center justify-between gap-4 rounded-card border border-ink/10 bg-paper px-4 py-3 transition hover:border-moss/40 hover:bg-cloud"
              >
                <div>
                  <ReadingContent className="font-black text-ink" text={material.title} />
                  <ReadingContent
                    className="mt-1 text-sm text-graphite"
                    text={`${material.content_type.replace("_", " ")} material`}
                  />
                </div>
                <ArrowRight aria-hidden="true" className="text-moss" size={20} />
              </Link>
            ))}
          </div>
        </Panel>
        <div className="grid gap-6">
          <AccessibilityProfileCard profile={data.profile} preferences={data.preferences} />
          <Panel>
            <Sparkles aria-hidden="true" className="text-moss" size={28} />
            <h2 className="mt-4 text-2xl font-black text-ink">Recommended next mode</h2>
            <ReadingContent
              className="mt-3 text-sm leading-7 text-graphite"
              text={`${data.stats.recommended_mode} is recommended from your saved accessibility profile.`}
            />
          </Panel>
        </div>
      </div>
    </div>
  );
}
