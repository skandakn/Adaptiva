import { Brain, Clock, FileCheck2, Focus } from "lucide-react";
import { ModeUsageChart, ProgressAreaChart } from "@/components/charts/learning-charts";
import { Panel } from "@/components/ui/panel";

const metrics = [
  { label: "Learning time", value: "4h 35m", icon: Clock },
  { label: "Focus sessions", value: "18", icon: Focus },
  { label: "Concepts understood", value: "34", icon: Brain },
  { label: "Materials completed", value: "7", icon: FileCheck2 }
];

export default function ProgressPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Learning Progress</p>
      <h1 className="mt-4 text-5xl font-black text-ink">Progress without pressure.</h1>
      <p className="mt-3 max-w-3xl text-xl leading-8 text-graphite">
        The goal is understanding, not noisy gamification.
      </p>
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
            <ProgressAreaChart />
          </div>
        </Panel>
        <Panel>
          <h2 className="text-2xl font-black text-ink">Accessibility modes used</h2>
          <div className="mt-4">
            <ModeUsageChart />
          </div>
        </Panel>
      </div>
    </div>
  );
}
