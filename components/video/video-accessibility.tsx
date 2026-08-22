"use client";

import { Captions, FileVideo, Save, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { ReadingContent } from "@/components/reading/reading-content";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { featuredLesson } from "@/lib/demo-data";

type TranscriptSegment = {
  start: number;
  text: string;
};

type VideoProcessPayload = {
  transcription?: {
    text?: string;
    segments?: TranscriptSegment[];
  };
  summary?: string;
  error?: { message?: string };
};

type GenerateNotesPayload = {
  notes?: string;
  error?: { message?: string };
};

function getCompleteTranscript(transcription: VideoProcessPayload["transcription"], segments: TranscriptSegment[]) {
  const fullText = transcription?.text?.trim();
  if (fullText) return fullText;
  return segments
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
}

function formatTimestamp(seconds: number) {
  return `${seconds.toFixed(2)}s`;
}

export function VideoAccessibility() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploadedVideoFile, setUploadedVideoFile] = useState<File | null>(null);
  const [transcriptSegments, setTranscriptSegments] = useState<TranscriptSegment[]>([]);
  const [rawTranscript, setRawTranscript] = useState("");
  const [notes, setNotes] = useState("");
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
    setUploadedVideoFile(file);
    setTranscriptSegments([]);
    setRawTranscript("");
    setNotes("");
    setVideoUrl(URL.createObjectURL(file));
    setStatus("Video loaded. Demo transcription pipeline is active.");
    void transcribeUploadedVideo(file);
  }

  async function transcribeUploadedVideo(file: File) {
    try {
      const formData = new FormData();
      formData.append("title", "DNA recorded video lesson");
      formData.append("video", file);
      formData.append("save_material", "false");

      setStatus("Transcribing uploaded video...");
      const response = await fetch("/api/video/process", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as VideoProcessPayload;
      if (!response.ok) throw new Error(payload.error?.message ?? "Video transcription failed.");
      const segments = payload.transcription?.segments ?? [];
      setTranscriptSegments(segments);
      setRawTranscript(getCompleteTranscript(payload.transcription, segments));
      setStatus("Timestamped transcript generated from uploaded video.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Video transcription is unavailable.");
    }
  }

  async function processVideo(action: "subtitles" | "simplify" | "save") {
    try {
      if (!uploadedVideoFile) {
        setStatus("Upload a video before processing.");
        return;
      }

      const formData = new FormData();
      formData.append("title", "DNA recorded video lesson");
      formData.append("video", uploadedVideoFile);
      formData.append("save_material", String(action === "save"));

      setStatus("Processing recorded video through backend demo pipeline...");
      const response = await fetch("/api/video/process", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as VideoProcessPayload;
      if (!response.ok) throw new Error(payload.error?.message ?? "Video processing failed.");
      const segments = payload.transcription?.segments ?? [];
      setTranscriptSegments(segments);
      setRawTranscript(getCompleteTranscript(payload.transcription, segments));
      if (payload.summary) setSummary(payload.summary);
      if (action === "subtitles") setStatus("Timestamped transcript generated from uploaded video.");
      if (action === "simplify") setStatus(payload.summary ?? featuredLesson.simplified);
      if (action === "save") {
        setSaved(true);
        setStatus("Accessible video transcript and summary saved.");
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Video processing is unavailable. Demo transcript remains visible.");
    }
  }

  async function generateNotes() {
    const transcript =
      rawTranscript.trim() ||
      transcriptSegments
        .map((segment) => segment.text.trim())
        .filter(Boolean)
        .join(" ")
        .trim();

    try {
      setStatus("Generating notes from transcript...");
      const response = await fetch("/api/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ transcript })
      });
      const payload = (await response.json()) as GenerateNotesPayload;
      if (!response.ok) throw new Error(payload.error?.message ?? "Notes could not be generated.");
      if (!payload.notes?.trim()) throw new Error("Notes could not be generated.");
      setNotes(payload.notes);
      setStatus("Notes generated from the video transcript.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Notes could not be generated.");
    }
  }

  return (
    <div className="grid gap-6">
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
        <div className="mt-4">
          <Button type="button" className="w-full sm:w-auto" onClick={() => void generateNotes()}>
            Generate Notes
          </Button>
        </div>
        <p className="mt-4 text-sm font-bold text-graphite">{status}</p>
      </Panel>
      <Panel>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">AI Video Notes</p>
        <h2 className="mt-2 text-3xl font-black text-ink">Timestamped transcript</h2>
        <div className="mt-5 space-y-3">
          {transcriptSegments.length ? (
            transcriptSegments.map((segment, index) => (
              <div key={`${segment.start}-${index}`} className="grid grid-cols-[4rem_1fr] gap-3 rounded-card bg-paper p-3">
                <span className="font-black text-moss">{formatTimestamp(segment.start)}</span>
                <ReadingContent className="text-sm leading-7 text-graphite" text={segment.text} />
              </div>
            ))
          ) : (
            <div className="rounded-card bg-paper p-3">
              <ReadingContent
                className="text-sm leading-7 text-graphite"
                text="Upload and process a video to see timestamped transcript segments."
              />
            </div>
          )}
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
        <div className="mt-5 rounded-card bg-paper p-4">
          <ReadingContent className="text-sm leading-7 text-graphite" text={summary} />
        </div>
        <p className="mt-4 min-h-6 text-sm font-bold text-moss">
          {saved ? "Accessible video material saved in demo mode." : "Demo data is clearly separated from real upload flow."}
        </p>
      </Panel>
    </div>
      {notes ? (
        <Panel>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-moss">Generated notes</p>
          <h2 className="mt-2 text-3xl font-black text-ink">AI video notes</h2>
          <div className="mt-5 rounded-card bg-paper p-4">
            <ReadingContent className="text-sm leading-7 text-graphite" text={notes} />
          </div>
        </Panel>
      ) : null}
    </div>
  );
}
