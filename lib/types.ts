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
