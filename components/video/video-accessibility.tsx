"use client";

import { Captions, FileVideo, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";

export function VideoAccessibility() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState("Demo transcript is ready.");
  const [saved, setSaved] = useState(false);
  const [summary, setSummary] = useState(featuredLesson.simplified);

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(URL.createObjectURL(file));
    setStatus("Video loaded. Demo transcription pipeline is active.");
  }

  async function processVideo(action: "subtitles" | "simplify" | "save") {
    try {
      setStatus("Processing recorded video through backend demo pipeline...");
      const response = await fetch("/api/video/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "DNA recorded video lesson",
          transcript: featuredLesson.transcript.map((line) => `${line.time} ${line.text}`).join("\n"),
          save_material: action === "save"
        })
      });
      const payload = (await response.json()) as {
        summary?: string;
        transcript?: string;
        error?: { message?: string };
      };
      if (!response.ok) throw new Error(payload.error?.message ?? "Video processing failed.");
      if (payload.summary) setSummary(payload.summary);
      if (action === "subtitles") setStatus("Subtitles generated from saved transcript data.");
      if (action === "simplify") setStatus(payload.summary ?? featuredLesson.simplified);
      if (action === "save") {
        setSaved(true);
        setStatus("Accessible video transcript and summary saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Video processing is unavailable. Demo transcript remains visible.");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <Panel>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Recorded Video Mode</p>
            <h1 className="mt-2 text-4xl font-black text-ink">Accessible video learning</h1>
          </div>
          <FileVideo aria-hidden="true" className="text-moss" size={32} />
        </div>
        <label className="mt-6 grid min-h-24 cursor-pointer place-items-center rounded-card border border-dashed border-moss/45 bg-mint/10 p-4 text-center font-black text-moss">
          Upload video
          <input
            className="sr-only"
            type="file"
            accept="video/*"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
        <div className="mt-5 overflow-hidden rounded-card bg-ink">
          {videoUrl ? (
            <video className="aspect-video w-full" src={videoUrl} controls />
          ) : (
            <div className="grid aspect-video place-items-center p-6 text-center text-white">
              <div>
                <Captions aria-hidden="true" className="mx-auto mb-3" size={36} />
                <p className="font-black">Sample biology lecture preview</p>
                <p className="mt-2 text-sm text-white/75">Upload a file or continue with demo data.</p>
              </div>
            </div>
          )}
        </div>
        <p className="mt-4 text-sm font-bold text-graphite">{status}</p>
      </Panel>
      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">AI Video Notes</p>
        <h2 className="mt-2 text-3xl font-black text-ink">Timestamped transcript</h2>
        <div className="mt-5 space-y-3">
          {featuredLesson.transcript.map((line) => (
            <div key={line.time} className="grid grid-cols-[4rem_1fr] gap-3 rounded-card bg-paper p-3">
              <span className="font-black text-moss">{line.time}</span>
              <p className="text-sm leading-7 text-graphite">{line.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {["Chapter generation", "Simplified explanation", "Concept extraction", "Focus mode"].map((item) => (
            <span key={item} className="rounded-card border border-ink/10 bg-white px-3 py-3 text-sm font-black text-ink">
              {item}
            </span>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={() => void processVideo("subtitles")}>
            <Captions aria-hidden="true" size={18} />
            Generate Subtitles
          </Button>
          <Button type="button" variant="secondary" onClick={() => void processVideo("simplify")}>
            <Sparkles aria-hidden="true" size={18} />
            Simplify
          </Button>
          <Button type="button" onClick={() => void processVideo("save")}>
            <Save aria-hidden="true" size={18} />
            Save
          </Button>
        </div>
        <div className="mt-5 rounded-card bg-paper p-4 text-sm leading-7 text-graphite">
          {summary}
        </div>
        <p className="mt-4 min-h-6 text-sm font-bold text-moss">
          {saved ? "Accessible video material saved in demo mode." : "Demo data is clearly separated from real upload flow."}
        </p>
      </Panel>
    </div>
  );
}
