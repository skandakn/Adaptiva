"use client";

import { RefreshCcw, Save, Sparkles } from "lucide-react";
import { useEffect, useId, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { ContentLanguage, MindMapNode } from "@/lib/types";

const BRANCH_PALETTE = [
  { ink: "#2F6B57", wash: "#E7F6F0", glow: "#53BFA5" },
  { ink: "#3D6FB8", wash: "#E8F1FB", glow: "#5A8FD8" },
  { ink: "#C45C50", wash: "#FBECEA", glow: "#E76F61" },
  { ink: "#B07A1A", wash: "#FBF3E0", glow: "#F2B84B" }
];

const NODE_H = 52;
const V_GAP = 88;
const H_GAP = 18;
const PAD = 36;
const LANGUAGE_LABEL: Record<ContentLanguage, string> = {
  English: "English",
  Kannada: "ಕನ್ನಡ",
  Hindi: "हिन्दी"
};

type PlacedNode = {
  node: MindMapNode;
  x: number;
  y: number;
  width: number;
  depth: number;
  branch: number;
  parent?: { x: number; y: number; width: number };
};

function estimateWidth(label: string) {
  const wide = /[\u0900-\u097F\u0C80-\u0CFF]/.test(label);
  const charWidth = wide ? 13 : 8.2;
  return Math.min(210, Math.max(128, Math.round(label.length * charWidth + 28)));
}

function subtreeWidth(node: MindMapNode): number {
  const self = estimateWidth(node.label);
  if (!node.children?.length) return self;
  const kids = node.children.reduce((sum, child, index) => {
    return sum + subtreeWidth(child) + (index > 0 ? H_GAP : 0);
  }, 0);
  return Math.max(self, kids);
}

function layoutMap(node: MindMapNode, left: number, y: number, depth: number, branch: number, parent?: PlacedNode): PlacedNode[] {
  const width = estimateWidth(node.label);
  const span = subtreeWidth(node);
  const x = left + span / 2 - width / 2;
  const current: PlacedNode = {
    node,
    x,
    y,
    width,
    depth,
    branch,
    parent: parent ? { x: parent.x, y: parent.y, width: parent.width } : undefined
  };

  if (!node.children?.length) return [current];

  let childLeft = left;
  const children = node.children.flatMap((child, index) => {
    const childSpan = subtreeWidth(child);
    const placed = layoutMap(child, childLeft, y + NODE_H + V_GAP, depth + 1, depth === 0 ? index : branch, current);
    childLeft += childSpan + H_GAP;
    return placed;
  });

  return [current, ...children];
}

export function MindMap({
  node,
  language = "English"
}: {
  node: MindMapNode;
  language?: ContentLanguage;
}) {
  const [selected, setSelected] = useState(node.id);
  const [saved, setSaved] = useState(false);
  const svgId = useId().replace(/:/g, "");
  const langCode = language === "Kannada" ? "kn" : language === "Hindi" ? "hi" : "en";

  useEffect(() => {
    const ids = new Set<string>();
    const walk = (item: MindMapNode) => {
      ids.add(item.id);
      item.children?.forEach(walk);
    };
    walk(node);
    setSelected((current) => (ids.has(current) ? current : node.id));
  }, [node]);

  const { placed, svgW, svgH, selectedNode } = useMemo(() => {
    const nodes = layoutMap(node, PAD, PAD + 8, 0, 0);
    const maxX = Math.max(...nodes.map((item) => item.x + item.width), 520);
    const maxY = Math.max(...nodes.map((item) => item.y + NODE_H), 280);
    return {
      placed: nodes,
      svgW: maxX + PAD,
      svgH: maxY + PAD + 12,
      selectedNode: nodes.find((item) => item.node.id === selected)?.node ?? node
    };
  }, [node, selected]);

  return (
    <Panel className="overflow-hidden bg-gradient-to-br from-white via-paper to-cloud">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Mind Map</p>
          <h3 className="mt-2 text-2xl font-black text-ink">Visual concept map</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon" type="button" aria-label="Reset mind map focus" onClick={() => setSelected(node.id)}>
            <RefreshCcw aria-hidden="true" size={18} />
          </Button>
          <Button variant="secondary" size="icon" type="button" aria-label="Save mind map" onClick={() => setSaved(true)}>
            <Save aria-hidden="true" size={18} />
          </Button>
        </div>
      </div>

      <div
        lang={langCode}
        className="relative mt-6 overflow-x-auto rounded-card border border-moss/15 bg-[radial-gradient(circle_at_top,#ffffff,rgba(238,245,242,0.92)_58%,#e7f1ec)] p-3 shadow-inner"
      >
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          width="100%"
          role="img"
          aria-label={`Concept map: ${node.label}`}
          className="min-h-[280px] max-h-[460px]"
        >
          <defs>
            <filter id={`${svgId}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#142322" floodOpacity="0.14" />
            </filter>
            <linearGradient id={`${svgId}-root-fill`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#142322" />
              <stop offset="100%" stopColor="#2F6B57" />
            </linearGradient>
          </defs>

          {placed.map((item) => {
            if (!item.parent) return null;
            const color = BRANCH_PALETTE[item.branch % BRANCH_PALETTE.length]!;
            const x1 = item.parent.x + item.parent.width / 2;
            const y1 = item.parent.y + NODE_H;
            const x2 = item.x + item.width / 2;
            const y2 = item.y;
            const midY = (y1 + y2) / 2;
            return (
              <path
                key={`edge-${item.node.id}`}
                d={`M ${x1} ${y1} C ${x1} ${midY}, ${x2} ${midY}, ${x2} ${y2}`}
                fill="none"
                stroke={color.glow}
                strokeWidth={item.depth === 1 ? 3 : 2}
                strokeLinecap="round"
              />
            );
          })}

          {placed.map((item) => {
            const active = selected === item.node.id;
            const color = BRANCH_PALETTE[item.branch % BRANCH_PALETTE.length]!;
            const isRoot = item.depth === 0;
            const lines = wrapLabel(item.node.label, isRoot ? 22 : 18);
            return (
              <g
                key={item.node.id}
                role="button"
                tabIndex={0}
                aria-label={`Focus on ${item.node.label}`}
                className="cursor-pointer outline-none"
                onClick={() => setSelected(item.node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setSelected(item.node.id);
                  }
                }}
              >
                <rect
                  x={item.x}
                  y={item.y}
                  width={item.width}
                  height={NODE_H}
                  rx={isRoot ? 18 : 14}
                  fill={isRoot ? `url(#${svgId}-root-fill)` : active ? color.ink : color.wash}
                  stroke={active || isRoot ? color.glow : color.ink}
                  strokeWidth={active ? 2.5 : 1.4}
                  filter={`url(#${svgId}-shadow)`}
                  className="pointer-events-none"
                />
                {lines.map((line, lineIndex) => (
                  <text
                    key={`${item.node.id}-${lineIndex}`}
                    x={item.x + item.width / 2}
                    y={item.y + NODE_H / 2 + (lineIndex - (lines.length - 1) / 2) * 14}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isRoot ? 13 : 12}
                    fontWeight={800}
                    fill={isRoot || active ? "#ffffff" : "#142322"}
                    fontFamily="inherit"
                    className="pointer-events-none"
                  >
                    {line}
                  </text>
                ))}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="rounded-card border border-moss/20 bg-white/80 p-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Selected idea</p>
          <p lang={langCode} className="mt-2 text-lg font-black text-ink">
            {selectedNode.label}
          </p>
          <p className="mt-1 text-sm font-bold text-graphite">
            {saved ? "Mind map saved to the demo learning space." : "Select a node to bring that idea into focus."}
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-card border border-ink/10 bg-paper px-4 py-3 text-sm font-black text-ink">
          <span className="grid size-9 place-items-center rounded-full bg-mint/20 text-moss">
            <Sparkles aria-hidden="true" size={17} />
          </span>
          <span>
            <span className="block text-xs uppercase tracking-[0.12em] text-graphite">Language</span>
            <span lang={langCode}>{LANGUAGE_LABEL[language]}</span>
          </span>
        </div>
      </div>
    </Panel>
  );
}

function wrapLabel(text: string, maxChars: number) {
  if (text.length <= maxChars) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);

  // Indic scripts may have long unbroken labels. Splitting by grapheme keeps
  // those labels inside their node instead of shrinking or overflowing.
  if (lines.length === 1 && lines[0]!.length > maxChars) {
    const characters = Array.from(text);
    const midpoint = Math.ceil(characters.length / 2);
    return [characters.slice(0, midpoint).join(""), characters.slice(midpoint).join("")];
  }

  return lines.slice(0, 2);
}
