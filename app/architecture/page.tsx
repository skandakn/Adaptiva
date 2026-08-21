import { ArchitectureDiagram } from "@/components/architecture/architecture-diagram";
import { Panel } from "@/components/ui/panel";

const privacy = [
  "User data should be encrypted in transit.",
  "Authentication is required for private content.",
  "Uploaded documents should not be publicly accessible.",
  "API keys remain server-side through environment variables.",
  "Minimum necessary data collection.",
  "User-controlled deletion.",
  "Accessibility preferences are settings, not diagnoses."
];

export default function ArchitecturePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <ArchitectureDiagram />
      <Panel className="mt-6">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Privacy & Security</p>
        <h2 className="mt-2 text-3xl font-black text-ink">Privacy-conscious architecture</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {privacy.map((item) => (
            <div key={item} className="rounded-card bg-paper p-4 text-sm font-bold leading-7 text-graphite">
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
