"use client";

import { GitBranch, RefreshCcw, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { MindMapNode } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MindMap({ node }: { node: MindMapNode }) {
  const [selected, setSelected] = useState(node.id);
  const [saved, setSaved] = useState(false);

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Mind Map</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Visual concept map</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" type="button" aria-label="Regenerate mind map" onClick={() => setSelected(node.id)}>
            <RefreshCcw aria-hidden="true" size={18} />
          </Button>
          <Button variant="secondary" size="icon" type="button" aria-label="Save mind map" onClick={() => setSaved(true)}>
            <Save aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>
      <div className="mt-6 overflow-x-auto rounded-card bg-paper p-4">
        <MapNode node={node} selected={selected} setSelected={setSelected} root />
      </div>
      <p className="mt-4 min-h-6 text-sm font-bold text-moss">
        {saved ? "Mind map saved to the demo learning space." : "Select any node to focus the explanation."}
      </p>
    </Panel>
  );
}

function MapNode({
  node,
  selected,
  setSelected,
  root = false
}: {
  node: MindMapNode;
  selected: string;
  setSelected: (id: string) => void;
  root?: boolean;
}) {
  const active = selected === node.id;
  return (
    <div className={cn("flex min-w-max items-center gap-4", !root && "ml-5")}>
      <button
        type="button"
        className={cn(
          "min-h-12 rounded-card border px-4 py-3 text-left text-sm font-black transition",
          active
            ? "border-moss bg-moss text-white shadow-lift"
            : "border-ink/10 bg-white text-ink hover:border-moss/40"
        )}
        onClick={() => setSelected(node.id)}
      >
        <span className="flex items-center gap-2">
          <GitBranch aria-hidden="true" size={16} />
          {node.label}
        </span>
      </button>
      {node.children?.length ? (
        <div className="grid gap-3 border-l-2 border-dashed border-mint/50 pl-4">
          {node.children.map((child) => (
            <MapNode key={child.id} node={child} selected={selected} setSelected={setSelected} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
