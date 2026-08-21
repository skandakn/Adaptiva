"use client";

import { cn } from "@/lib/utils";
import type { FigureSpec } from "@/lib/types";

// ─── Shared visual tokens ────────────────────────────────────────────────────
const NODE_FILL = "#F8FAF7";
const NODE_STROKE = "#142322";
const ARROW_COLOR = "#2F6B57";
const LABEL_COLOR = "#2F6B57";
const TEXT_COLOR = "#142322";
const CONNECTOR_COLOR = "#4A5552";

// ─── Arrow marker definition ─────────────────────────────────────────────────
function Defs() {
  return (
    <defs>
      <marker
        id="ttf-arrow"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill={ARROW_COLOR} />
      </marker>
      <marker
        id="ttf-arrow-cycle"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill={ARROW_COLOR} />
      </marker>
    </defs>
  );
}

// ─── Utility: wrap text into lines ──────────────────────────────────────────
function wrapText(text: string, maxChars = 22): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if ((current + " " + word).trim().length <= maxChars) {
      current = (current + " " + word).trim();
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

// ─── PROCESS DIAGRAM ─────────────────────────────────────────────────────────
function ProcessDiagram({ spec }: { spec: FigureSpec }) {
  const nodeW = 200;
  const nodeH = 60;
  const gapY = 60;
  const svgW = 320;
  const centerX = svgW / 2;
  const totalH = spec.nodes.length * (nodeH + gapY) + 20;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${totalH}`}
      width="100%"
      role="img"
      aria-label={`Process diagram: ${spec.title}`}
      className="max-h-[520px]"
    >
      <title>{spec.title}</title>
      <Defs />
      {spec.nodes.map((node, i) => {
        const y = i * (nodeH + gapY) + 10;
        const x = centerX - nodeW / 2;
        const lines = wrapText(node.label, 26);
        const nextNode = spec.nodes[i + 1];
        // Find relationship label
        const rel = spec.relationships.find((r) => r.from === node.id && r.to === nextNode?.id);
        return (
          <g key={node.id} role="listitem">
            {/* Box */}
            <rect
              x={x}
              y={y}
              width={nodeW}
              height={nodeH}
              rx={8}
              fill={NODE_FILL}
              stroke={NODE_STROKE}
              strokeWidth={1.5}
            />
            {/* Label */}
            {lines.map((line, li) => (
              <text
                key={li}
                x={centerX}
                y={y + nodeH / 2 + (li - (lines.length - 1) / 2) * 17}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight={700}
                fill={TEXT_COLOR}
                fontFamily="inherit"
              >
                {line}
              </text>
            ))}
            {/* Arrow + connector label */}
            {nextNode && (
              <>
                <line
                  x1={centerX}
                  y1={y + nodeH}
                  x2={centerX}
                  y2={y + nodeH + gapY - 4}
                  stroke={ARROW_COLOR}
                  strokeWidth={2}
                  markerEnd="url(#ttf-arrow)"
                />
                {rel?.label && (
                  <text
                    x={centerX + 8}
                    y={y + nodeH + gapY / 2}
                    fontSize={10}
                    fill={LABEL_COLOR}
                    fontWeight={600}
                    fontFamily="inherit"
                  >
                    {rel.label}
                  </text>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── CYCLE DIAGRAM ───────────────────────────────────────────────────────────
function CycleDiagram({ spec }: { spec: FigureSpec }) {
  const cx = 200;
  const cy = 200;
  const r = 130;
  const nodeW = 110;
  const nodeH = 46;
  const n = spec.nodes.length;
  const svgSize = 420;

  const positions = spec.nodes.map((_, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  return (
    <svg
      viewBox={`0 0 ${svgSize} ${svgSize}`}
      width="100%"
      role="img"
      aria-label={`Cycle diagram: ${spec.title}`}
      className="max-h-[480px]"
    >
      <title>{spec.title}</title>
      <Defs />
      {/* Centre label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={14}
        fontWeight={800}
        fill={ARROW_COLOR}
        fontFamily="inherit"
      >
        {spec.title}
      </text>

      {positions.map((pos, i) => {
        const next = positions[(i + 1) % n]!;
        const nodePos = pos;
        const lines = wrapText(spec.nodes[i]!.label, 18);
        return (
          <g key={spec.nodes[i]!.id}>
            {/* Connector to next node */}
            <line
              x1={nodePos.x}
              y1={nodePos.y}
              x2={next.x}
              y2={next.y}
              stroke={ARROW_COLOR}
              strokeWidth={2}
              markerEnd="url(#ttf-arrow-cycle)"
            />
            {/* Node box */}
            <rect
              x={nodePos.x - nodeW / 2}
              y={nodePos.y - nodeH / 2}
              width={nodeW}
              height={nodeH}
              rx={8}
              fill={NODE_FILL}
              stroke={NODE_STROKE}
              strokeWidth={1.5}
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={nodePos.x}
                y={nodePos.y + (li - (lines.length - 1) / 2) * 15}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={700}
                fill={TEXT_COLOR}
                fontFamily="inherit"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── CONCEPT MAP ─────────────────────────────────────────────────────────────
function ConceptMap({ spec }: { spec: FigureSpec }) {
  const svgW = 480;
  const nodeH = 44;
  const nodeW = 160;
  const centerX = svgW / 2;
  const rootY = 30;
  const childGapY = 90;

  // Root = first node; children = rest
  const [root, ...children] = spec.nodes;
  const totalH = children.length > 0 ? rootY + nodeH + childGapY + nodeH + 30 : rootY + nodeH + 30;

  const childXPositions = children.map((_, i) => {
    const spread = (children.length - 1) * 170;
    return centerX - spread / 2 + i * 170;
  });

  return (
    <svg
      viewBox={`0 0 ${svgW} ${Math.max(totalH, 200)}`}
      width="100%"
      role="img"
      aria-label={`Concept map: ${spec.title}`}
      className="max-h-[400px]"
    >
      <title>{spec.title}</title>
      <Defs />
      {/* Root node */}
      {root && (
        <>
          <rect
            x={centerX - nodeW / 2}
            y={rootY}
            width={nodeW}
            height={nodeH}
            rx={8}
            fill="#142322"
            stroke="#142322"
            strokeWidth={1.5}
          />
          <text
            x={centerX}
            y={rootY + nodeH / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={800}
            fill="#ffffff"
            fontFamily="inherit"
          >
            {root.label.length > 22 ? root.label.slice(0, 19) + "…" : root.label}
          </text>
        </>
      )}

      {children.map((child, i) => {
        const cx = childXPositions[i] ?? centerX;
        const cy = rootY + nodeH + childGapY;
        const lines = wrapText(child.label, 18);
        return (
          <g key={child.id}>
            <line
              x1={centerX}
              y1={rootY + nodeH}
              x2={cx}
              y2={cy}
              stroke={ARROW_COLOR}
              strokeWidth={1.5}
              markerEnd="url(#ttf-arrow)"
            />
            <rect
              x={cx - nodeW / 2}
              y={cy}
              width={nodeW}
              height={nodeH}
              rx={8}
              fill={NODE_FILL}
              stroke={NODE_STROKE}
              strokeWidth={1.5}
            />
            {lines.map((line, li) => (
              <text
                key={li}
                x={cx}
                y={cy + nodeH / 2 + (li - (lines.length - 1) / 2) * 15}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={12}
                fontWeight={600}
                fill={TEXT_COLOR}
                fontFamily="inherit"
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── COMPARISON FIGURE ───────────────────────────────────────────────────────
function ComparisonFigure({ spec }: { spec: FigureSpec }) {
  const leftNodes = spec.nodes.filter((n) => n.side === "left");
  const rightNodes = spec.nodes.filter((n) => n.side === "right");
  const maxRows = Math.max(leftNodes.length, rightNodes.length);

  return (
    <div className="overflow-x-auto" role="img" aria-label={`Comparison: ${spec.title}`}>
      <table className="w-full border-collapse text-sm font-bold">
        <caption className="sr-only">{spec.title}</caption>
        <thead>
          <tr>
            <th className="rounded-tl-card bg-ink px-4 py-3 text-left text-white">
              {spec.leftLabel ?? "Option A"}
            </th>
            <th className="rounded-tr-card bg-moss px-4 py-3 text-left text-white">
              {spec.rightLabel ?? "Option B"}
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: maxRows }).map((_, i) => (
            <tr key={i} className={cn("border-b border-ink/10", i % 2 === 0 ? "bg-white" : "bg-paper")}>
              <td className="px-4 py-3 text-ink">
                {leftNodes[i]?.label ?? "—"}
              </td>
              <td className="px-4 py-3 text-moss">
                {rightNodes[i]?.label ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── FLOWCHART ───────────────────────────────────────────────────────────────
function Flowchart({ spec }: { spec: FigureSpec }) {
  const svgW = 320;
  const gapY = 64;
  const centerX = svgW / 2;
  const totalH = spec.nodes.length * (56 + gapY) + 20;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${totalH}`}
      width="100%"
      role="img"
      aria-label={`Flowchart: ${spec.title}`}
      className="max-h-[540px]"
    >
      <title>{spec.title}</title>
      <Defs />
      {spec.nodes.map((node, i) => {
        const y = i * (56 + gapY) + 10;
        const isDecision = node.label.endsWith("?");
        const lines = wrapText(node.label, 22);
        const nextNode = spec.nodes[i + 1];
        const rel = spec.relationships.find((r) => r.from === node.id && r.to === nextNode?.id);

        if (isDecision) {
          const hw = 90;
          const hh = 36;
          const points = `${centerX},${y} ${centerX + hw},${y + hh} ${centerX},${y + hh * 2} ${centerX - hw},${y + hh}`;
          return (
            <g key={node.id}>
              <polygon points={points} fill="#EEF5F2" stroke={NODE_STROKE} strokeWidth={1.5} />
              <text x={centerX} y={y + hh} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={TEXT_COLOR} fontFamily="inherit">
                {node.label}
              </text>
              {nextNode && (
                <line x1={centerX} y1={y + hh * 2} x2={centerX} y2={y + hh * 2 + gapY - 4} stroke={ARROW_COLOR} strokeWidth={2} markerEnd="url(#ttf-arrow)" />
              )}
              {rel?.condition && (
                <text x={centerX + 8} y={y + hh * 2 + gapY / 2} fontSize={10} fill={LABEL_COLOR} fontWeight={600} fontFamily="inherit">{rel.condition}</text>
              )}
            </g>
          );
        }

        return (
          <g key={node.id}>
            <rect x={centerX - 100} y={y} width={200} height={56} rx={8} fill={NODE_FILL} stroke={NODE_STROKE} strokeWidth={1.5} />
            {lines.map((line, li) => (
              <text key={li} x={centerX} y={y + 28 + (li - (lines.length - 1) / 2) * 16} textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700} fill={TEXT_COLOR} fontFamily="inherit">
                {line}
              </text>
            ))}
            {nextNode && (
              <line x1={centerX} y1={y + 56} x2={centerX} y2={y + 56 + gapY - 4} stroke={ARROW_COLOR} strokeWidth={2} markerEnd="url(#ttf-arrow)" />
            )}
            {rel?.label && (
              <text x={centerX + 8} y={y + 56 + gapY / 2} fontSize={10} fill={LABEL_COLOR} fontWeight={600} fontFamily="inherit">{rel.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── TIMELINE ────────────────────────────────────────────────────────────────
function Timeline({ spec }: { spec: FigureSpec }) {
  const svgH = 200;
  const padX = 40;
  const n = spec.nodes.length;
  const svgW = Math.max(480, n * 130 + padX * 2);
  const lineY = svgH / 2;
  const step = (svgW - padX * 2) / Math.max(n - 1, 1);

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ minWidth: `${Math.min(svgW, 600)}px` }}
        role="img"
        aria-label={`Timeline: ${spec.title}`}
        className="max-h-[220px]"
      >
        <title>{spec.title}</title>
        {/* Spine */}
        <line x1={padX} y1={lineY} x2={svgW - padX} y2={lineY} stroke={ARROW_COLOR} strokeWidth={2.5} markerEnd="url(#ttf-arrow)" />
        <Defs />

        {spec.nodes.map((node, i) => {
          const x = padX + i * step;
          const above = i % 2 === 0;
          const lines = wrapText(node.label, 14);
          const textY = above ? lineY - 28 - (lines.length - 1) * 13 : lineY + 28;
          return (
            <g key={node.id}>
              <circle cx={x} cy={lineY} r={7} fill={ARROW_COLOR} />
              <line x1={x} y1={above ? lineY - 7 : lineY + 7} x2={x} y2={above ? lineY - 22 : lineY + 22} stroke={CONNECTOR_COLOR} strokeWidth={1.5} />
              {lines.map((line, li) => (
                <text key={li} x={x} y={textY + li * 14} textAnchor="middle" fontSize={11} fontWeight={700} fill={TEXT_COLOR} fontFamily="inherit">
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SYSTEM DIAGRAM ──────────────────────────────────────────────────────────
function SystemDiagram({ spec }: { spec: FigureSpec }) {
  const svgW = 480;
  const svgH = 360;
  const cx = svgW / 2;
  const cy = svgH / 2;
  const nodeW = 130;
  const nodeH = 44;

  // Place nodes in a grid or ring based on count
  const n = spec.nodes.length;
  const positions = spec.nodes.map((node, i) => {
    if (node.position) return { x: node.position.x * svgW, y: node.position.y * svgH };
    // ring layout
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const r = Math.min(cx, cy) * 0.65;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const posMap = new Map(spec.nodes.map((n, i) => [n.id, positions[i]!]));

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      role="img"
      aria-label={`System diagram: ${spec.title}`}
      className="max-h-[400px]"
    >
      <title>{spec.title}</title>
      <Defs />
      {spec.relationships.map((rel, i) => {
        const from = posMap.get(rel.from);
        const to = posMap.get(rel.to);
        if (!from || !to) return null;
        const mx = (from.x + to.x) / 2;
        const my = (from.y + to.y) / 2;
        return (
          <g key={i}>
            <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={ARROW_COLOR} strokeWidth={1.5} markerEnd="url(#ttf-arrow)" />
            {rel.label && (
              <text x={mx} y={my - 6} textAnchor="middle" fontSize={9} fill={LABEL_COLOR} fontWeight={600} fontFamily="inherit">
                {rel.label}
              </text>
            )}
          </g>
        );
      })}
      {spec.nodes.map((node, i) => {
        const pos = positions[i]!;
        const lines = wrapText(node.label, 18);
        return (
          <g key={node.id}>
            <rect x={pos.x - nodeW / 2} y={pos.y - nodeH / 2} width={nodeW} height={nodeH} rx={8} fill={NODE_FILL} stroke={NODE_STROKE} strokeWidth={1.5} />
            {lines.map((line, li) => (
              <text key={li} x={pos.x} y={pos.y + (li - (lines.length - 1) / 2) * 14} textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700} fill={TEXT_COLOR} fontFamily="inherit">
                {line}
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── INFOGRAPHIC ─────────────────────────────────────────────────────────────
function Infographic({ spec }: { spec: FigureSpec }) {
  return (
    <div role="img" aria-label={`Infographic: ${spec.title}`} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {spec.nodes.map((node, i) => (
        <div
          key={node.id}
          className="rounded-card border border-ink/10 bg-paper p-4"
        >
          <span className="text-2xl font-black text-moss">{String(i + 1).padStart(2, "0")}</span>
          <p className="mt-2 font-black text-ink">{node.label}</p>
          {node.detail && (
            <p className="mt-1 text-sm leading-6 text-graphite">{node.detail}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── ANNOTATED FIGURE ────────────────────────────────────────────────────────
function AnnotatedFigure({ spec }: { spec: FigureSpec }) {
  // Render as a centred hub with radiating labels
  return <SystemDiagram spec={spec} />;
}

// ─── MAIN RENDERER ───────────────────────────────────────────────────────────
export function FigureRenderer({ spec, className }: { spec: FigureSpec; className?: string }) {
  return (
    <div className={cn("w-full overflow-hidden", className)}>
      {spec.type === "process" && <ProcessDiagram spec={spec} />}
      {spec.type === "cycle" && <CycleDiagram spec={spec} />}
      {spec.type === "concept-map" && <ConceptMap spec={spec} />}
      {spec.type === "comparison" && <ComparisonFigure spec={spec} />}
      {spec.type === "flowchart" && <Flowchart spec={spec} />}
      {spec.type === "timeline" && <Timeline spec={spec} />}
      {spec.type === "system" && <SystemDiagram spec={spec} />}
      {spec.type === "annotated" && <AnnotatedFigure spec={spec} />}
      {spec.type === "infographic" && <Infographic spec={spec} />}
    </div>
  );
}
