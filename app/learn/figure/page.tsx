import type { Metadata } from "next";
import { FigureWorkspace } from "@/components/learning/figure/figure-workspace";

export const metadata: Metadata = {
  title: "Text-to-Figure | Adaptiva",
  description:
    "Adaptiva Text-to-Figure (TTF) converts educational text into clear, contextual visual explanations. Turn complex information into something you can see."
};

export default function FigurePage() {
  return <FigureWorkspace />;
}
