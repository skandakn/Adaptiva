import { ArrowRight, Brain, Clock, Flame, Sparkles, Target } from "lucide-react";
import Link from "next/link";
import { AccessibilityProfileCard } from "@/components/accessibility/profile-card";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { sampleLessons } from "@/lib/demo-data";

const stats = [
  { label: "Learning streak", value: "5 days", icon: Flame },
  { label: "Focus sessions", value: "18", icon: Clock },
  { label: "Concepts mastered", value: "34", icon: Brain },
  { label: "Recommended mode", value: "Step-by-step", icon: Target }
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Student Dashboard</p>
          <h1 className="mt-4 text-5xl font-black leading-tight text-ink">Good to see you.</h1>
          <p className="mt-3 text-xl leading-8 text-graphite">
            Your learning environment is adapted to you.
          </p>
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
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Continue learning</p>
          <h2 className="mt-2 text-3xl font-black text-ink">Biology - Cell & Molecular Systems</h2>
          <div className="mt-5 space-y-3">
            {sampleLessons.map((lesson) => (
              <Link
                key={lesson.id}
                href="/learn"
                className="flex min-h-20 items-center justify-between gap-4 rounded-card border border-ink/10 bg-paper px-4 py-3 transition hover:border-moss/40 hover:bg-cloud"
              >
                <div>
                  <p className="font-black text-ink">{lesson.title}</p>
                  <p className="mt-1 text-sm text-graphite">{lesson.readingTime} adaptive lesson</p>
                </div>
                <ArrowRight aria-hidden="true" className="text-moss" size={20} />
              </Link>
            ))}
          </div>
        </Panel>
        <div className="grid gap-6">
          <AccessibilityProfileCard />
          <Panel>
            <Sparkles aria-hidden="true" className="text-moss" size={28} />
            <h2 className="mt-4 text-2xl font-black text-ink">Recommended next mode</h2>
            <p className="mt-3 text-sm leading-7 text-graphite">
              Step-by-step mode is recommended because DNA replication has multiple ordered actions.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
