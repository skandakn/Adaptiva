import { NextResponse } from "next/server";
import { explainStepByStep, generateMindMap, simplifyText, summarizeContent } from "@/lib/ai-service";
import { featuredLesson } from "@/lib/demo-data";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as { text?: string };
  const text = body.text?.trim() || featuredLesson.original;

  const [simplified, summary, steps, mindMap] = await Promise.all([
    simplifyText(text, "simple"),
    summarizeContent(text),
    explainStepByStep(),
    generateMindMap()
  ]);

  return NextResponse.json({
    mode: "demo",
    simplified,
    summary,
    steps,
    mindMap
  });
}
