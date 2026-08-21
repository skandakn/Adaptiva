import { CheckCircle2, Headphones, Languages, ListChecks, ScanText } from "lucide-react";
import { Panel } from "@/components/ui/panel";

const defaults = [
  { label: "Reading", value: "Dyslexia-friendly", icon: ScanText },
  { label: "Focus", value: "Reduced distractions", icon: CheckCircle2 },
  { label: "Explanation", value: "Simple + step-by-step", icon: ListChecks },
  { label: "Audio", value: "Enabled", icon: Headphones },
  { label: "Language", value: "English", icon: Languages }
];

export function AccessibilityProfileCard({
  title = "Adaptive Profile",
  compact = false
}: {
  title?: string;
  compact?: boolean;
}) {
  return (
    <Panel className={compact ? "p-4" : undefined} as="article">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">{title}</p>
          <h3 className="mt-2 text-xl font-black text-ink">Built around your preferences</h3>
        </div>
        <span className="rounded-card bg-mint/15 px-3 py-2 text-xs font-black text-moss">Ready</span>
      </div>
      <dl className="mt-5 grid gap-3">
        {defaults.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex min-h-12 items-center gap-3 rounded-card border border-ink/8 bg-paper px-3"
            >
              <Icon aria-hidden="true" className="text-moss" size={18} />
              <div>
                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-graphite">
                  {item.label}
                </dt>
                <dd className="text-sm font-black text-ink">{item.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>
    </Panel>
  );
}
