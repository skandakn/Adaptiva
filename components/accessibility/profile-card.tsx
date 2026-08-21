import { CheckCircle2, Headphones, Languages, ListChecks, ScanText } from "lucide-react";
import { Panel } from "@/components/ui/panel";

type ProfileCardData = {
  reading_style?: string;
  focus_mode?: boolean;
  audio_enabled?: boolean;
  preferred_language?: string;
};

type PreferencesCardData = {
  step_by_step_support?: boolean;
};

export function AccessibilityProfileCard({
  title = "Adaptive Profile",
  compact = false,
  profile,
  preferences
}: {
  title?: string;
  compact?: boolean;
  profile?: ProfileCardData | null;
  preferences?: PreferencesCardData | null;
}) {
  const defaults = [
    { label: "Reading", value: profile?.reading_style ?? "Dyslexia-friendly", icon: ScanText },
    { label: "Focus", value: profile?.focus_mode === false ? "Guided" : "Reduced distractions", icon: CheckCircle2 },
    {
      label: "Explanation",
      value: preferences?.step_by_step_support === false ? "Simple" : "Simple + step-by-step",
      icon: ListChecks
    },
    { label: "Audio", value: profile?.audio_enabled === false ? "Optional" : "Enabled", icon: Headphones },
    { label: "Language", value: profile?.preferred_language ?? "English", icon: Languages }
  ];

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
