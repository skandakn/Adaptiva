"use client";

import { ArrowDown, Database, Lock, Server, Sparkles } from "lucide-react";
import { useState } from "react";
import { Panel } from "@/components/ui/panel";
import { architectureNodes } from "@/lib/demo-data";
import { supabaseReadySchema } from "@/lib/data-model";
import { cn } from "@/lib/utils";

const flows = [
  "PDF: Upload -> Parse -> AI -> Accessibility Engine -> Adapted Content",
  "Live Lecture: Microphone -> Speech Recognition -> AI -> Live Accessible Notes",
  "Video: Upload -> Audio Extraction -> Transcription -> AI -> Accessible Video Learning",
  "Image: Upload -> OCR -> AI -> Accessible Text",
  "Text: Paste -> AI -> Accessibility Engine -> Adapted Content"
];

export function ArchitectureDiagram() {
  const [active, setActive] = useState("accessibility");
  const node = architectureNodes.find((item) => item.id === active) ?? architectureNodes[0];

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">System Architecture</p>
        <h1 className="mt-2 text-4xl font-black text-ink">Adaptive accessibility pipeline</h1>
        <div className="mt-6 grid gap-3">
          {architectureNodes.map((item, index) => (
            <div key={item.id}>
              <button
                type="button"
                className={cn(
                  "w-full rounded-card border p-4 text-left transition",
                  active === item.id
                    ? "border-moss bg-mint/14 shadow-lift"
                    : "border-ink/10 bg-white hover:border-moss/40 hover:bg-cloud"
                )}
                onClick={() => setActive(item.id)}
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="text-lg font-black text-ink">{item.title}</span>
                  <Sparkles aria-hidden="true" className="text-moss" size={18} />
                </span>
                <span className="mt-2 block text-sm leading-7 text-graphite">{item.detail}</span>
              </button>
              {index < architectureNodes.length - 1 ? (
                <ArrowDown aria-hidden="true" className="mx-auto my-2 text-moss" size={20} />
              ) : null}
            </div>
          ))}
        </div>
      </Panel>
      <div className="grid gap-6">
        <Panel>
          <h2 className="text-2xl font-black text-ink">{node.title}</h2>
          <p className="mt-3 text-lg leading-8 text-graphite">{node.detail}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { icon: Server, label: "Backend", value: "Next.js API routes" },
              { icon: Database, label: "Database", value: "Supabase / PostgreSQL" },
              { icon: Sparkles, label: "AI", value: "Configurable provider + demo fallback" },
              { icon: Lock, label: "Privacy", value: "Server-side keys only" }
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-card bg-paper p-4">
                  <Icon aria-hidden="true" className="text-moss" size={22} />
                  <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-graphite">
                    {item.label}
                  </p>
                  <p className="mt-1 font-black text-ink">{item.value}</p>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel>
          <h2 className="text-2xl font-black text-ink">Data flow</h2>
          <div className="mt-4 space-y-3">
            {flows.map((flow) => (
              <button
                type="button"
                key={flow}
                className="w-full rounded-card border border-ink/10 bg-paper px-4 py-3 text-left text-sm font-bold text-graphite transition hover:border-moss/40 hover:bg-cloud hover:text-ink"
                onClick={() => setActive("processing")}
              >
                {flow}
              </button>
            ))}
          </div>
        </Panel>
        <Panel>
          <h2 className="text-2xl font-black text-ink">Supabase / PostgreSQL model</h2>
          <pre className="mt-4 max-h-56 overflow-auto rounded-card bg-ink p-4 text-xs leading-6 text-white">
            {supabaseReadySchema}
          </pre>
        </Panel>
      </div>
    </div>
  );
}
