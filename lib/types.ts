export type AccessibilitySupport =
  | "Dyslexia-friendly reading"
  | "Focus support"
  | "Simplified explanations"
  | "Audio learning"
  | "Larger text"
  | "High contrast"
  | "Translation support"
  | "Step-by-step learning"
  | "Visual concept maps";

export type LearningMode = "Original" | "Simplified" | "Focus" | "Audio" | "Visual";

export type ContentLanguage = "English" | "Kannada" | "Hindi" | "Urdu" | "Tamil";

export type MindMapNode = {
  id: string;
  label: string;
  children?: MindMapNode[];
};

export type Lesson = {
  id: string;
  title: string;
  course: string;
  readingTime: string;
  original: string;
  simplified: string;
  verySimple: string;
  stepByStep: string[];
  keyConcepts: string[];
  quiz: { question: string; answer: string }[];
  mindMap: MindMapNode;
  transcript: { time: string; text: string }[];
};

export type TutorMessage = {
  role: "user" | "assistant";
  content: string;
};

// ─── Text-to-Figure (TTF) types ────────────────────────────────────────────

export type FigureType =
  | "process"
  | "flowchart"
  | "concept-map"
  | "cycle"
  | "comparison"
  | "timeline"
  | "system"
  | "annotated"
  | "infographic";

export type FigureComplexity = "simple" | "detailed";

export type FigureNode = {
  id: string;
  label: string;
  detail?: string;
  /** For comparison figures: which column (left | right) */
  side?: "left" | "right";
  /** For annotated / system figures: optional position hint */
  position?: { x: number; y: number };
};

export type FigureRelationship = {
  from: string;
  to: string;
  label?: string;
  /** For flowcharts: "yes" | "no" */
  condition?: string;
};

export type FigureSpec = {
  id: string;
  title: string;
  type: FigureType;
  topic: string;
  complexity: FigureComplexity;
  nodes: FigureNode[];
  relationships: FigureRelationship[];
  /** Sequential text sentences that narrate the figure */
  explanation: string[];
  /** Key concepts extracted from source text */
  sourceConcepts: string[];
  /** Truncated source text used to generate this figure */
  sourceText: string;
  /** Left column header for comparison figures */
  leftLabel?: string;
  /** Right column header for comparison figures */
  rightLabel?: string;
  createdAt?: string;
};
