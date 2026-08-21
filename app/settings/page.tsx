import { AccessibilityToolbar } from "@/components/accessibility/accessibility-toolbar";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import Link from "next/link";

const sections = [
  ["Reading", "Font, font size, spacing, width"],
  ["Focus", "Distraction reduction, focus guide, animation control"],
  ["Audio", "Voice, speed, auto-read"],
  ["Visual", "Contrast, brightness-friendly mode, reduced motion"],
  ["Language", "English, Hindi, Kannada, Urdu, Tamil"],
  ["Interaction", "Keyboard navigation, larger buttons"]
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-moss">Accessibility Settings</p>
      <h1 className="mt-4 text-5xl font-black text-ink">A polished control room for learning comfort.</h1>
      <p className="mt-3 max-w-3xl text-xl leading-8 text-graphite">
        Settings can be adjusted manually or reset to the recommended adaptive profile.
      </p>
      <div className="mt-8">
        <AccessibilityToolbar />
      </div>
      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map(([title, body]) => (
          <Panel key={title}>
            <h2 className="text-2xl font-black text-ink">{title}</h2>
            <p className="mt-3 text-sm leading-7 text-graphite">{body}</p>
            <Button className="mt-5" variant="secondary" asChild>
              <Link href="#accessibility-controls">Adjust {title}</Link>
            </Button>
          </Panel>
        ))}
      </div>
    </div>
  );
}
