/**
 * lib/figure-service.ts
 *
 * Text-to-Figure AI service.  Follows the same pattern as lib/ai-service.ts:
 *  - When OPENAI_API_KEY is set, call the OpenAI Responses API.
 *  - Otherwise fall through to deterministic demo / keyword-based fallback.
 *
 * Public entry-point: generateFigureSpecification()
 */

import { demoFigures } from "@/lib/demo-data";
import type { FigureComplexity, FigureNode, FigureRelationship, FigureSpec, FigureType } from "@/lib/types";

// ─── Internal helpers ────────────────────────────────────────────────────────

const delay = (ms = 420) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function callOpenAI(systemPrompt: string, userPrompt: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  if ((process.env.AI_PROVIDER ?? "openai") !== "openai") return null;

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL ?? "gpt-4.1-mini",
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      })
    });

    if (!response.ok) return null;
    const data = (await response.json()) as { output_text?: string };
    return data.output_text?.trim() ?? null;
  } catch {
    return null;
  }
}

// ─── Keyword-based demo matching ─────────────────────────────────────────────

const KEYWORD_MAP: Record<string, string> = {
  dna: "demo-dna-replication",
  replication: "demo-dna-replication",
  helicase: "demo-dna-replication",
  polymerase: "demo-dna-replication",
  "water cycle": "demo-water-cycle",
  evaporation: "demo-water-cycle",
  condensation: "demo-water-cycle",
  precipitation: "demo-water-cycle",
  photosynthesis: "demo-photosynthesis",
  chlorophyll: "demo-photosynthesis",
  glucose: "demo-photosynthesis",
  mitosis: "demo-mitosis-meiosis",
  meiosis: "demo-mitosis-meiosis"
};

function matchDemo(content: string): FigureSpec | undefined {
  const lower = content.toLowerCase();
  for (const [keyword, demoId] of Object.entries(KEYWORD_MAP)) {
    if (lower.includes(keyword)) {
      return demoFigures.find((f) => f.id === demoId);
    }
  }
  return undefined;
}

// ─── Complexity slicing ───────────────────────────────────────────────────────

function applyComplexity(spec: FigureSpec, complexity: FigureComplexity): FigureSpec {
  if (complexity === "simple") {
    const maxNodes = 6;
    const keptIds = new Set(spec.nodes.slice(0, maxNodes).map((n) => n.id));
    return {
      ...spec,
      complexity,
      nodes: spec.nodes.slice(0, maxNodes),
      relationships: spec.relationships.filter((r) => keptIds.has(r.from) && keptIds.has(r.to)),
      explanation: spec.explanation.slice(0, Math.min(spec.explanation.length, 5))
    };
  }
  return { ...spec, complexity };
}

// ─── Generic sentence-based fallback figure builder ──────────────────────────

function buildGenericFigure(content: string, complexity: FigureComplexity): FigureSpec {
  // Split into sentences
  const sentences = content
    .replace(/([.!?])\s+/g, "$1\n")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const maxNodes = complexity === "simple" ? 5 : 10;
  const selected = sentences.slice(0, maxNodes);

  const nodes: FigureNode[] = selected.map((sentence, i) => ({
    id: `n${i + 1}`,
    label: sentence.length > 52 ? sentence.slice(0, 49) + "…" : sentence,
    detail: sentence
  }));

  const relationships: FigureRelationship[] = nodes.slice(0, -1).map((node, i) => ({
    from: node.id,
    to: nodes[i + 1]!.id
  }));

  const explanation = [
    "Figure: Concept Overview.",
    ...selected.map((s, i) => `${i === 0 ? "First" : i === selected.length - 1 ? "Finally" : "Next"}, ${s.charAt(0).toLowerCase() + s.slice(1)}`)
  ];

  // Extract rough concepts — nouns / capitalised words
  const concepts = [...new Set(
    content.match(/\b[A-Z][a-zA-Z]{2,}\b/g) ?? []
  )].slice(0, 8);

  return {
    id: uid(),
    title: "Concept Overview",
    type: "process",
    topic: "Learning",
    complexity,
    nodes,
    relationships,
    explanation,
    sourceConcepts: concepts.length ? concepts : ["Key concept"],
    sourceText: content.slice(0, 240),
    createdAt: new Date().toISOString()
  };
}

// ─── Auto figure-type selection ───────────────────────────────────────────────

function autoSelectFigureType(content: string): FigureType {
  const lower = content.toLowerCase();
  if (/vs\.?|versus|compar|differ|contrast/i.test(lower)) return "comparison";
  if (/cycle|circular|repeat|loop|continuous/i.test(lower)) return "cycle";
  if (/timeline|century|year \d{4}|first.*then.*finally|history|chronol/i.test(lower)) return "timeline";
  if (/decision|if.*then|branch|either|or else|flowchart/i.test(lower)) return "flowchart";
  if (/parts? of|consist of|made up of|component|structure|system/i.test(lower)) return "system";
  if (/step \d|first.*next.*then|process|procedure|sequence/i.test(lower)) return "process";
  if (/relationship|related|connect|associate|network/i.test(lower)) return "concept-map";
  return "process";
}

// ─── OpenAI-powered figure generation ────────────────────────────────────────

async function generateWithAI(
  content: string,
  figureType: FigureType,
  complexity: FigureComplexity
): Promise<FigureSpec | null> {
  const maxNodes = complexity === "simple" ? 6 : 12;

  const systemPrompt = `You are an educational figure generator for the Adaptiva accessibility platform.
Your task is to convert educational text into a structured JSON figure specification.
Respond with ONLY valid JSON — no markdown fences, no commentary.

The JSON must have this exact shape:
{
  "title": "string (topic name)",
  "type": "${figureType}",
  "topic": "string (subject area)",
  "nodes": [
    { "id": "n1", "label": "short label max 55 chars", "detail": "one sentence explanation" }
  ],
  "relationships": [
    { "from": "n1", "to": "n2", "label": "optional connector label" }
  ],
  "explanation": ["sentence 1", "sentence 2", ...],
  "sourceConcepts": ["concept1", "concept2", ...]
}

Rules:
- Maximum ${maxNodes} nodes
- Labels must be concise (under 55 characters)
- explanation must narrate the figure sequentially, starting with "Figure: <title>."
- Only include information present in the source text
- If the figure type is "comparison", add "side": "left" or "side": "right" to each node
- For comparison figures, also include "leftLabel" and "rightLabel" at the top level
- Do NOT invent facts not in the source text`;

  const userPrompt = `Figure type: ${figureType}\nComplexity: ${complexity} (max ${maxNodes} nodes)\n\nSource text:\n${content}`;

  const raw = await callOpenAI(systemPrompt, userPrompt);
  if (!raw) return null;

  try {
    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    const parsed = JSON.parse(cleaned) as Partial<FigureSpec>;

    // Validate minimum shape
    if (!parsed.nodes || !Array.isArray(parsed.nodes) || parsed.nodes.length === 0) return null;
    if (!parsed.title || !parsed.explanation) return null;

    return {
      id: uid(),
      title: parsed.title,
      type: figureType,
      topic: parsed.topic ?? "Learning",
      complexity,
      nodes: parsed.nodes.slice(0, maxNodes),
      relationships: Array.isArray(parsed.relationships) ? parsed.relationships : [],
      explanation: Array.isArray(parsed.explanation) ? parsed.explanation : [],
      sourceConcepts: Array.isArray(parsed.sourceConcepts) ? parsed.sourceConcepts : [],
      sourceText: content.slice(0, 240),
      leftLabel: parsed.leftLabel,
      rightLabel: parsed.rightLabel,
      createdAt: new Date().toISOString()
    };
  } catch {
    return null;
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Main entry-point. Implements the full TTF pipeline:
 * analyzeContent → extractConcepts → detectRelationships →
 * selectFigureType → generateFigureSpecification → validate
 */
export async function generateFigureSpecification(
  content: string,
  figureType: "auto" | FigureType = "auto",
  complexity: FigureComplexity = "simple"
): Promise<FigureSpec> {
  const resolvedType: FigureType =
    figureType === "auto" ? autoSelectFigureType(content) : figureType;

  // 1. Try OpenAI if available
  const aiResult = await generateWithAI(content, resolvedType, complexity);
  if (aiResult) return aiResult;

  // 2. Simulate processing delay for demo
  await delay();

  // 3. Try keyword-matched demo
  const demo = matchDemo(content);
  if (demo) {
    const cloned = { ...demo, id: uid(), createdAt: new Date().toISOString() };
    return applyComplexity(cloned, complexity);
  }

  // 4. Generic sentence-based fallback
  return buildGenericFigure(content, complexity);
}

/** Adjust complexity of an existing FigureSpec without re-generating */
export function adjustComplexity(spec: FigureSpec, complexity: FigureComplexity): FigureSpec {
  return applyComplexity(spec, complexity);
}
